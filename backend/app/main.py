"""FastAPI application – PRD → Blog multi-agent pipeline."""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
import tempfile
import os

load_dotenv()

from app.services.run_store import RunStore              # noqa: E402
from app.services.orchestrator import run_pipeline        # noqa: E402
from app.utils.file_upload import (                       # noqa: E402
    extract_text_from_file,
    validate_file_size,
    validate_file_extension
)

# Lazy import PDF generator to avoid WeasyPrint dependency issues on Windows
def get_pdf_generator():
    try:
        from app.utils.pdf_generator import generate_pdf_from_run_state
        return generate_pdf_from_run_state
    except ImportError as e:
        raise ImportError(
            f"PDF generation is not available. WeasyPrint requires GTK+ libraries. "
            f"Error: {str(e)}"
        )

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CreateRunRequest(BaseModel):
    prd: str
    tone: str = "professional"
    audience: str = "engineers"
    word_count: int = Field(default=800, ge=200, le=5000)
    use_web_search: bool = False
    model_provider: str | None = None  # "groq" or "gemini"
    model_name: str | None = None  # e.g., "groq/llama-3.1-8b-instant" or "gemini/gemini-2.0-flash-exp"


class CreateRunResponse(BaseModel):
    run_id: str


class SubmitFeedbackRequest(BaseModel):
    stage: str = Field(..., description="Stage to provide feedback for: researcher, writer, fact_checker, or style_editor")
    feedback: str = Field(..., description="User's feedback or revision instructions")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "runs"

@asynccontextmanager
async def lifespan(_app: FastAPI):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    yield

app = FastAPI(title="PRD → Blog Agent Pipeline", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = RunStore(DATA_DIR)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file (PDF, TXT, or Markdown) and extract its text content.
    Returns the extracted text that can be used as PRD input.
    """
    try:
        # Validate file extension
        validate_file_extension(file.filename)
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size
        validate_file_size(len(file_content))
        
        # Save to temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text from the file
            extracted_text = extract_text_from_file(temp_file_path, file.filename)
            
            return {
                "success": True,
                "filename": file.filename,
                "text": extracted_text,
                "length": len(extracted_text)
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except ValueError as e:
        # Validation errors (file size, extension)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Extraction or other errors
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.post("/runs", response_model=CreateRunResponse)
async def create_run(req: CreateRunRequest):
    run_id = str(uuid.uuid4())
    store.init_run(run_id, req.model_dump())
    return CreateRunResponse(run_id=run_id)


@app.post("/runs/{run_id}/execute")
async def execute_run(run_id: str):
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    if state.get("status") in ("RUNNING",):
        raise HTTPException(409, "Run already in progress")
    try:
        result = await run_pipeline(run_id, state, store)
        return result
    except Exception as exc:
        store.set_status(run_id, "ERROR", error=str(exc))
        raise HTTPException(500, detail=str(exc))


@app.post("/runs/{run_id}/feedback")
async def submit_feedback(run_id: str, req: SubmitFeedbackRequest):
    """
    Submit feedback for a specific stage and re-run from that point forward.
    
    Stage values:
    - researcher: Re-run researcher, writer, fact-checker, style editor
    - writer: Re-run writer, fact-checker, style editor
    - fact_checker: Re-run fact-checker, style editor
    - style_editor: Re-run style editor only
    """
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    if state.get("status") in ("RUNNING",):
        raise HTTPException(409, "Run already in progress")
    
    valid_stages = ["researcher", "writer", "fact_checker", "style_editor"]
    if req.stage not in valid_stages:
        raise HTTPException(400, f"Invalid stage. Must be one of: {', '.join(valid_stages)}")
    
    try:
        # Import the feedback-aware pipeline
        from app.services.orchestrator import run_pipeline_with_feedback
        
        # Add feedback to state
        store.add_feedback(run_id, req.stage, req.feedback)
        
        # Re-run from the specified stage
        result = await run_pipeline_with_feedback(run_id, state, store, req.stage, req.feedback)
        return result
    except Exception as exc:
        store.set_status(run_id, "ERROR", error=str(exc))
        raise HTTPException(500, detail=str(exc))


@app.post("/runs/{run_id}/linkedin-pack")
async def generate_linkedin_pack(run_id: str):
    """
    Generate LinkedIn Pack (Pipeline B) - Optional post-blog content generation.
    
    Requires Pipeline A to be complete (status: DONE or DONE_WITH_WARNINGS).
    
    Returns:
    - claims_check: Safe vs risky claims analysis
    - linkedin_post: Platform-optimized post with hashtags and CTA
    - image_prompt: SDXL-optimized prompt for image generation (HF integration later)
    """
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    
    # Check Pipeline A is complete
    status = state.get("status")
    if status not in ("DONE", "DONE_WITH_WARNINGS"):
        raise HTTPException(
            400, 
            f"Pipeline A must be complete before generating LinkedIn pack. Current status: {status}"
        )
    
    # Check if linkedin_pack already exists
    if state.get("linkedin_pack"):
        return state["linkedin_pack"]
    
    try:
        from app.services.linkedin_orchestrator import run_linkedin_pipeline
        
        result = await run_linkedin_pipeline(run_id, state, store)
        
        # Return the generated linkedin_pack
        updated_state = store.load(run_id)
        return updated_state.get("linkedin_pack", result)
    except Exception as exc:
        error_msg = f"LinkedIn pack generation failed: {str(exc)}"
        store.log(run_id, f"❌ {error_msg}")
        raise HTTPException(500, detail=error_msg)


@app.post("/runs/{run_id}/generate-image")
async def generate_linkedin_image(run_id: str):
    """
    Generate image using Leonardo AI based on the image prompt from LinkedIn Pack.
    
    Requires LinkedIn Pack to be generated first.
    
    Returns:
    - generation_id: Leonardo generation ID
    - images: List of generated image URLs
    - status: success or failed
    """
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    
    # Check if linkedin_pack exists
    linkedin_pack = state.get("linkedin_pack")
    if not linkedin_pack:
        raise HTTPException(400, "LinkedIn pack must be generated first")
    
    # Check if image already generated
    if linkedin_pack.get("generated_image"):
        return linkedin_pack["generated_image"]
    
    try:
        from app.services.leonardo_service import LeonardoService
        
        image_prompt_data = linkedin_pack.get("image_prompt", {})
        prompt = image_prompt_data.get("prompt", "")
        negative_prompt = image_prompt_data.get("negative_prompt", "")
        
        if not prompt:
            raise HTTPException(400, "No image prompt found in LinkedIn pack")
        
        store.log(run_id, f"🎨 Generating image with Leonardo AI...")
        store.log(run_id, f"Prompt: {prompt[:100]}...")
        
        # Initialize Leonardo service
        leonardo = LeonardoService()
        
        # Generate image
        result = await leonardo.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=1024,
            height=768,
            guidance_scale=7
        )
        
        store.log(run_id, f"✓ Image generated: {len(result['images'])} image(s)")
        
        # Store image result in linkedin_pack
        linkedin_pack["generated_image"] = result
        store.update_linkedin_pack(run_id, "generated_image", result)
        
        return result
        
    except Exception as exc:
        error_msg = f"Image generation failed: {str(exc)}"
        store.log(run_id, f"❌ {error_msg}")
        raise HTTPException(500, detail=error_msg)


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    return state


@app.get("/runs/{run_id}/export/pdf")
async def export_pdf(run_id: str):
    """
    Generate and download PDF export of the final blog post
    with styled formatting and preserved citations
    """
    state = store.load(run_id)
    if state is None:
        raise HTTPException(404, "Run not found")
    
    # Check if pipeline is complete
    status = state.get("status")
    if status not in ("DONE", "DONE_WITH_WARNINGS"):
        raise HTTPException(400, f"Cannot export PDF. Run status: {status}. Pipeline must be complete.")
    
    try:
        # Lazy load PDF generator
        generate_pdf_from_run_state = get_pdf_generator()
        pdf_bytes = generate_pdf_from_run_state(state)
        
        # Generate filename from run_id or blog title
        filename = f"blog-post-{run_id[:8]}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except ImportError as ie:
        raise HTTPException(
            503, 
            detail=f"PDF export is unavailable on this server. {str(ie)}"
        )
    except ValueError as ve:
        raise HTTPException(400, detail=str(ve))
    except Exception as exc:
        store.log(run_id, f"❌ PDF export error: {str(exc)}")
        raise HTTPException(500, detail=f"PDF generation failed: {str(exc)}")
