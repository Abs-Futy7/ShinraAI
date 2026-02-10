# Shinrai AI - Intelligent Content Generation Platform

> **Enterprise-grade multi-agent system for automated technical content generation with fact-checking, citation management, and social media optimization**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-0.80.0-FF6B6B?style=flat)](https://www.crewai.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Dual Pipeline System](#dual-pipeline-system)
4. [Agent Specifications](#agent-specifications)
5. [Technology Stack](#technology-stack)
6. [Data Flow & State Management](#data-flow--state-management)
7. [API Reference](#api-reference)
8. [Setup & Installation](#setup--installation)
9. [Configuration](#configuration)
10. [Deployment](#deployment)

---

## Overview

**Shinrai AI** is a sophisticated content generation platform that leverages multi-agent AI systems to transform Product Requirements Documents (PRDs) into publication-ready blog posts with comprehensive fact-checking, citation management, and optional LinkedIn content packages with AI-generated imagery.

### Key Capabilities

- **Dual Pipeline Architecture**: Separate workflows for blog generation (Pipeline A) and social media content (Pipeline B)
- **Multi-Agent Collaboration**: Specialized AI agents working sequentially with role-based expertise
- **Intelligent Fact-Checking**: Automated verification with iterative refinement loops
- **Citation Management**: Automatic source tracking with standardized reference notation ([S0], [S1], etc.)
- **Web Research Integration**: Optional real-time Google Search integration (Gemini models only)
- **Multi-Format Input**: Support for PDF, TXT, Markdown, and image files with OCR
- **State Persistence**: Complete run history with logs and intermediate outputs
- **Production-Ready**: Rate limiting, error handling, fallback chains, and async processing

---

## System Architecture

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│                     Next.js 14 Frontend (TypeScript)                │
│                                                                     │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │  PRD Input   │  │    Timeline    │  │   LinkedIn Modal       │ │
│  │  Form UI     │  │    Viewer      │  │   (Post + Image)       │ │
│  │  + Templates │  │  + Live Logs   │  │   + PDF Export         │ │
│  └──────────────┘  └────────────────┘  └────────────────────────┘ │
└───────────────────────────┬────────────────────────────────────────┘
                            │ REST API (HTTP/JSON)
┌───────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION LAYER                              │
│                    FastAPI Backend (Python)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │   Routes     │  │  Orchestrators   │  │   Run Store       │   │
│  │  /runs       │──│  - Blog Pipeline │──│  (State Mgmt)     │   │
│  │  /upload     │  │  - LinkedIn Pack │  │  JSON + Logs      │   │
│  │  /feedback   │  │  - Retry Logic   │  └───────────────────┘   │
│  └──────────────┘  └──────────────────┘                            │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                        │
│                    CrewAI Multi-Agent Framework                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              PIPELINE A: Blog Content Generation           │   │
│  │                                                            │   │
│  │  ┌───────────┐   ┌──────────┐   ┌────────────┐   ┌─────┐ │   │
│  │  │Researcher │──▶│  Writer  │──▶│Fact Checker│──▶│Style│ │   │
│  │  │  Agent    │   │  Agent   │   │   Agent    │   │ Edit│ │   │
│  │  └───────────┘   └──────────┘   └────────────┘   └─────┘ │   │
│  │       │              │                 │             │    │   │
│  │       │ Extract      │ Draft with      │ Verify      │Polish│   │
│  │       │ Facts +      │ Citations       │ Claims      │ &   │   │
│  │       │ Sources      │ [S0], [S1]...   │ Loop up to  │Tone │   │
│  │       │ (with Web    │                 │ 3x          │     │   │
│  │       │ Search)      │                 │             │     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │             PIPELINE B: LinkedIn Pack Generation           │   │
│  │                                                            │   │
│  │  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐  │   │
│  │  │ Claims   │──▶│   LinkedIn   │──▶│  Image Prompt    │  │   │
│  │  │ Analyst  │   │   Content    │   │   Engineer       │  │   │
│  │  │ Agent    │   │   Agent      │   │   Agent          │  │   │
│  │  └──────────┘   └──────────────┘   └──────────────────┘  │   │
│  │       │              │                      │             │   │
│  │       │ Flag Risky   │ Create 120-220      │ Generate    │   │
│  │       │ Marketing    │ word post with      │ SDXL        │   │
│  │       │ Claims       │ hooks + hashtags    │ Prompt      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└────────────────────────┬───────────────────┬────────────────────────┘
                         │                   │
┌────────────────────────▼───────────────────▼────────────────────────┐
│                    INTEGRATION LAYER                                │
│                                                                     │
│  ┌─────────────────────────┐    ┌────────────────────────────┐    │
│  │    LLM Providers        │    │   External Services        │    │
│  │                         │    │                            │    │
│  │  Groq (Fast Inference): │    │  Leonardo AI:              │    │
│  │  • llama-3.1-8b-instant │◀───│  • SDXL Image Generation   │    │
│  │  • llama-3.3-70b        │    │  • Async polling           │    │
│  │  • mixtral-8x7b         │    │                            │    │
│  │  (No function calling)  │    │  SerperDev:                │    │
│  │                         │    │  • Google Search API       │    │
│  │  Gemini (Web Search):   │◀───│  (Gemini models only)      │    │
│  │  • gemini-2.5-flash     │    │                            │    │
│  │  • gemini-1.5-flash     │    │  WeasyPrint:               │    │
│  │  • gemini-1.5-pro       │    │  • HTML→PDF Export         │    │
│  │  (Function calling ✓)   │    │                            │    │
│  │                         │    │  EasyOCR:                  │    │
│  │  Rate Limit Handling:   │    │  • Image text extraction   │    │
│  │  • Auto-fallback chains │    │                            │    │
│  │  • Exponential backoff  │    │  PyPDF:                    │    │
│  └─────────────────────────┘    │  • PDF text extraction     │    │
│                                 └────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Dual Pipeline System

Shinrai AI implements a sophisticated dual-pipeline architecture with specialized agent teams for different content objectives.

### Pipeline A: Blog Content Generation

**Purpose**: Convert PRDs into fact-checked, well-cited blog posts  
**Execution**: Sequential with iterative refinement  
**Duration**: 2-5 minutes (depending on PRD length and model)

#### Agent Workflow

```
PRD Input → Researcher → Writer → Fact Checker → Style Editor → Final Blog
              ↓           ↓          ↓ (retry loop)      ↓
           Research    Draft with   Verification    Polished
            JSON      Citations     (max 3 iter)    Markdown
```

**Key Features:**
- **Iterative Fact-Checking**: Up to 3 retry attempts with specific revision instructions
- **Source Tracking**: All facts linked to sources ([S0] = PRD, [S1-Sn] = web sources)
- **Web Search Integration**: Optional Google Search via SerperDev (Gemini models only)
- **Fallback Handling**: Automatic model switching on rate limits
- **State Persistence**: Every step saved to JSON with timestamps and logs

### Pipeline B: LinkedIn Pack Generation

**Purpose**: Transform completed blogs into LinkedIn posts with AI-generated images  
**Execution**: Sequential, 3-agent workflow  
**Duration**: 30-60 seconds  
**Prerequisites**: Must complete Pipeline A first

#### Agent Workflow

```
Final Blog → Claims Analyst → LinkedIn Writer → Prompt Engineer → Leonardo AI
               ↓                 ↓                    ↓               ↓
           Risk Analysis    120-220 word post   SDXL Prompt    Generated Image
           (FTC compliance)  + Hashtags + CTA   + Negatives     (1024x1024)
```

**Key Features:**
- **Marketing Compliance**: Identifies and flags risky claims (superlatives, guarantees, unsubstantiated stats)
- **Platform Optimization**: LinkedIn-specific formatting with hooks, bullets, and CTAs
- **Image Generation**: SDXL-Lightning optimized prompts with negative prompts
- **Safety First**: Agents avoid adding facts beyond source blog

---

## Agent Specifications

### Pipeline A Agents

#### 1. Researcher Agent (Product Researcher)

**Role**: Extract key facts from PRD and optionally perform web research  
**Model**: Groq/Gemini (configurable)  
**Temperature**: 0.5 (balanced)  
**Tools**: SerperDevTool (Google Search) - Gemini models only

**Input:**
- PRD text (from user or uploaded file)
- Optional web search queries

**Output Format** (JSON):
```json
{
  "queries": ["search query 1", "search query 2"],
  "sources": [
    {
      "id": "S0",
      "title": "PRD",
      "url": "internal://prd",
      "key_facts": ["fact 1", "fact 2", "fact 3"]
    },
    {
      "id": "S1",
      "title": "Article Title",
      "url": "https://example.com",
      "key_facts": ["web fact 1", "web fact 2"]
    }
  ],
  "summary_facts": ["consolidated fact 1", "consolidated fact 2"],
  "unknowns": ["topic needing more research"]
}
```

**Validation**: Ensures `sources` array exists with at least S0 (PRD)

---

#### 2. Writer Agent (Content Writer)

**Role**: Create initial blog draft with proper citations  
**Model**: Groq/Gemini (configurable)  
**Temperature**: 0.5 (balanced creativity)  
**Tools**: None

**Input:**
- PRD text
- Research JSON from Researcher
- Tone, audience, word count parameters
- Revision instructions (if fact-check failed previously)

**Output Format** (Markdown):
```markdown
# Blog Title

Introduction paragraph with cited facts [S1] and [S2].

## Section 1

More content with citations [S3]. When uncertain, uses [NEEDS CONFIRMATION].

## Conclusion

Summary with cite [S0].
```

**Citation Rules:**
- All facts must reference a source: [S0], [S1], [S2], etc.
- Use `[NEEDS CONFIRMATION]` if fact cannot be verified
- Never invent facts not present in research JSON

---

#### 3. Fact Checker Agent (Fact Checker)

**Role**: Verify all claims match source material  
**Model**: Groq/Gemini (configurable)  
**Temperature**: 0.2 (highly conservative for consistency)  
**Tools**: None

**Input:**
- Draft blog (Markdown)
- Research JSON

**Output Format** (JSON):
```json
{
  "passed": false,
  "issues": [
    {
      "claim": "Our AI is 10x faster",
      "reason": "No source supports '10x' claim",
      "suggested_fix": "Remove quantitative claim or cite source",
      "source_ids": []
    }
  ],
  "rewrite_instructions": "Remove unsupported performance claims. Ensure all statistics cite [S#]."
}
```

**Retry Logic:**
- If `passed = false`, Writer re-runs with revision instructions
- Maximum 3 iterations (1 initial + 2 retries)
- Final status: `DONE` (passed) or `DONE_WITH_WARNINGS` (failed after retries)

---

#### 4. Style Editor Agent (Polisher)

**Role**: Improve readability and tone without altering facts  
**Model**: Groq/Gemini (configurable)  
**Temperature**: 0.5 (balanced)  
**Tools**: None

**Input:**
- Draft blog (latest version)
- Tone and audience parameters

**Output Format** (Markdown):
- Polished version of draft
- **MUST PRESERVE all [S#] citations**
- **CANNOT add new facts**

**Constraints:**
- Only modify phrasing, sentence structure, transitions
- Keep all technical accuracy
- Match requested tone (professional, friendly, playful, academic, casual)

---

### Pipeline B Agents

#### 5. Claims Analyst Agent (Marketing Compliance Analyst)

**Role**: Flag risky marketing claims for FTC compliance  
**Model**: Always `groq/llama-3.1-8b-instant` (forced to avoid Gemini API limits)  
**Temperature**: 0.2 (conservative for consistent flagging)  
**Tools**: None

**Input:**
- Final blog content
- Product name

**Output Format** (Pydantic/JSON):
```json
{
  "safe_claims": [
    "Our tool helps teams collaborate",
    "Built with React and TypeScript"
  ],
  "risky_claims": [
    {
      "claim": "Guaranteed to increase productivity by 50%",
      "risk_type": "guarantee",
      "suggestion": "Users report productivity improvements"
    }
  ],
  "overall_assessment": "MEDIUM_RISK"
}
```

**Risk Categories:**
- **Superlatives**: "best", "#1", "fastest"
- **Guarantees**: "guaranteed", "will solve", "never fails"
- **Unsubstantiated Stats**: "50% more efficient" without study
- **Health/Safety**: Claims requiring FDA approval

---

#### 6. LinkedIn Content Agent (LinkedIn Content Strategist)

**Role**: Create platform-optimized LinkedIn posts  
**Model**: Always `groq/llama-3.1-8b-instant`  
**Temperature**: 0.6 (higher for engaging copy)  
**Tools**: None

**Input:**
- Blog content
- Audience, tone, product name, goal
- Risky claims to avoid (from Claims Analyst)

**Output Format** (Pydantic/JSON):
```json
{
  "post_text": "Hook: Did you know...?\n\nProblem context\n\n✅ Benefit 1\n✅ Benefit 2\n\nCTA: Join our waitlist",
  "hashtags": ["#ProductManagement", "#AI", "#TechInnovation", "..."],
  "cta": "Join our waitlist at example.com",
  "word_count": 187
}
```

**Requirements:**
- 120-220 words
- Hook (1-2 sentences)
- 2-4 bullet points for skimmability
- 8-12 relevant hashtags
- Clear CTA
- NO risky claims

---

#### 7. Image Prompt Engineer Agent (AI Image Prompt Engineer)

**Role**: Generate SDXL-optimized prompts for Leonardo AI  
**Model**: Always `groq/llama-3.1-8b-instant`  
**Temperature**: 0.5 (balanced)  
**Tools**: None

**Input:**
- LinkedIn post text
- Brand tone, product category, brand colors

**Output Format** (Pydantic/JSON):
```json
{
  "prompt": "Modern minimalist workspace with laptop, soft blue lighting, professional photography style, clean composition",
  "negative_prompt": "no text, no watermarks, no logos, no words, blurry, low quality, distorted",
  "model_suggestion": "SDXL-Lightning",
  "style_notes": "Professional tech aesthetic with emphasis on clean lines"
}
```

**Best Practices:**
- 1-2 sentence prompts
- Avoid text/typography in images
- Include negative prompts for quality
- Match brand aesthetic

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115.0 | High-performance async API framework |
| **CrewAI** | 0.80.0 | Multi-agent orchestration with YAML config |
| **LiteLLM** | Latest | Unified LLM interface (Groq + Gemini) |
| **Pydantic** | 2.9.2 | Data validation and serialization |
| **httpx** | 0.27.0 | Async HTTP client for Leonardo AI |
| **python-dotenv** | 1.0.1 | Environment variable management |
| **PyPDF** | Latest | PDF text extraction |
| **EasyOCR** | Latest | Image text extraction |
| **Aspose HTML** | 26.1.0 | HTML to PDF conversion |
| **Pygments** | 2.18.0 | Syntax highlighting |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.15 | React framework with App Router |
| **TypeScript** | 5.0 | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.13 | Utility-first styling |
| **Framer Motion** | 12.34.0 | Animation library |
| **react-markdown** | 9.0.1 | Markdown rendering |
| **remark-gfm** | 4.0.0 | GitHub Flavored Markdown |
| **lucide-react** | 0.563.0 | Icon library |
| **clsx** | 2.1.1 | Conditional CSS classes |

### LLM Providers

#### Groq (Fast Inference)
- **llama-3.1-8b-instant**: Default model, ultra-fast, 8K context
- **llama-3.3-70b-versatile**: Best quality, 128K context
- **mixtral-8x7b-32768**: Fallback option, 32K context
- **Limitation**: No function calling support (cannot use SerperDevTool)

#### Google Gemini (Web Search Capable)
- **gemini-2.5-flash**: Recommended, fast and cost-effective
- **gemini-1.5-flash**: Alternative flash model
- **gemini-1.5-pro**: Highest quality, larger context
- **Advantage**: Function calling support enables SerperDevTool integration

### External Services

- **Leonardo AI**: SDXL-Lightning image generation (1024x1024 default)
- **SerperDev**: Google Search API (100 free queries/month)
- **Aspose HTML**: HTML to PDF export with styling preservation

---

## Data Flow & State Management

### Run State Structure

Each execution creates a unique run with the following JSON structure:

```json
{
  "run_id": "uuid-v4",
  "status": "PENDING|RUNNING|DONE|DONE_WITH_WARNINGS|ERROR",
  "inputs": {
    "prd": "Product requirements document text...",
    "tone": "professional|friendly|playful|academic|casual",
    "audience": "engineers|marketers|executives|general",
    "word_count": 800,
    "use_web_search": false,
    "model_provider": "groq|gemini",
    "model_name": "groq/llama-3.1-8b-instant"
  },
  "steps": {
    "research": { /* Research JSON */ },
    "drafts": [{ "iteration": 1, "text": "..." }],
    "fact_checks": [{ "iteration": 1, "passed": false, "issues": [...] }],
    "final": { "markdown": "..." }
  },
  "citations": [
    { "id": "S0", "title": "PRD", "url": "internal://prd" }
  ],
  "linkedin_pack": {
    "claims_check": { /* Claims analysis */ },
    "linkedin_post": { /* Post JSON */ },
    "image_prompt": { /* Prompt JSON */ },
    "image_url": "https://cdn.leonardo.ai/..."
  },
  "logs": [
    { "message": "▶ Step 1: Researcher starting", "timestamp": "..." }
  ],
  "error": null,
  "created_at": "2026-02-10T12:00:00Z",
  "updated_at": "2026-02-10T12:03:45Z"
}
```

### Storage Architecture

```
backend/data/runs/
  ├── <run-id-1>/
  │   ├── state.json      # Complete run state
  │   └── logs.txt        # Human-readable log file
  ├── <run-id-2>/
  │   ├── state.json
  │   └── logs.txt
  └── ...
```

**Advantages:**
- No database setup required
- Easy debugging (inspect JSON files directly)
- Portable (copy entire data/ folder)
- Upgrade path to PostgreSQL/MongoDB clear

---

## Advanced Features

### 1. Iterative Fact-Checking Loop

**Problem**: LLMs sometimes make unsupported claims  
**Solution**: Automatic retry with specific feedback

**Flow:**

**Flow:**
```
Writer creates draft → Fact Checker finds issues
      ↓                          ↓
   Iteration 1              Failed: 3 issues
      ↓                          ↓
Rewrite with feedback   → Fact Checker verifies
      ↓                          ↓
   Iteration 2              Failed: 1 issue
      ↓                          ↓
Rewrite with feedback   → Fact Checker verifies
      ↓                          ↓
   Iteration 3              Passed ✓
```

**Max Retries**: 3 total iterations (1 + 2 retries)  
**Feedback**: Specific revision instructions with issue details  
**Final Status**: `DONE` or `DONE_WITH_WARNINGS`

### 2. Rate Limit Handling

**Problem**: Free tier API limits (Groq: 30 req/min, Gemini: 15 req/min)  
**Solution**: Automatic fallback chain + exponential backoff

```python
GROQ_MODEL_FALLBACKS = [
    "groq/llama-3.1-8b-instant",    # Primary
    "groq/llama-3.3-70b-versatile", # Fallback 1
    "groq/mixtral-8x7b-32768"       # Fallback 2
]
```

When rate limited:
1. Detect error message containing "rate_limit"
2. Switch to next model in fallback chain
3. Retry TaskExecutor automatically
4. Log model switches for transparency

### 3. User Feedback System

**Feature**: Re-run any stage with human feedback

**Endpoints:**
```http
POST /runs/{run_id}/feedback
{
  "stage": "researcher|writer|fact_checker|style_editor",
  "feedback": "Please focus more on security features"
}
```

**Behavior**:
- **Researcher feedback**: Re-runs entire pipeline from research
- **Writer feedback**: Re-runs from writer stage with feedback context
- **Fact checker feedback**: Re-verifies with specific concerns
- **Style editor feedback**: Applies styling adjustments

### 4. Web Research Integration

**Capability**: Google Search during research phase  
**Requirements**: 
- Gemini model selected (Groq doesn't support function calling)
- SERPER_API_KEY in environment
- "Enable Web Search" checked in UI

**Implementation:**
```python
from app.tools.search_tool import get_serper_tool

if use_web_search and model_provider == "gemini":
    crew_instance.researcher().tools = [get_serper_tool()]
```

**Search Flow:**
1. Researcher generates search queries
2. SerperDevTool executes Google Search
3. Results added as sources S1, S2, S3...
4. Writer incorporates web facts with citations

### 5. Multi-Format File Upload

**Supported Formats:**
- **PDF** (via PyPDF): Text extraction from documents
- **TXT/MD**: Direct reading
- **Images** (PNG/JPG via EasyOCR): OCR for screenshots

**Validation:**
- Max file size: 10MB
- Allowed extensions: .pdf, .txt, .md, .png, .jpg, .jpeg
- Error handling: 400 for invalid files, 500 for extraction errors

### 6. PDF Export

**Feature**: Download blog with formatting and citations

**Implementation:**
```python
from app.utils.pdf_generator import generate_pdf_from_run_state

@app.get("/runs/{run_id}/pdf")
async def export_pdf(run_id: str):
    state = store.load(run_id)
    pdf_bytes = generate_pdf_from_run_state(state)
    return Response(content=pdf_bytes, media_type="application/pdf")
```

**Output**: Professional PDF with:
- Blog title and metadata
- Full blog content with formatting
- Citations section with clickable links
- Syntax highlighting for code blocks

---

## API Reference

### Core Endpoints

#### `POST /upload`

Upload and extract text from files (PDF, TXT, MD, images).

**Request:**
```http
POST /upload
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "success": true,
  "filename": "prd.pdf",
  "text": "Extracted text content...",
  "length": 1542
}
```

---

#### `POST /runs`

Create a new blog generation run.

**Request:**
```json
{
  "prd": "Product requirements document...",
  "tone": "professional",
  "audience": "engineers",
  "word_count": 800,
  "use_web_search": false,
  "model_provider": "groq",
  "model_name": "groq/llama-3.1-8b-instant"
}
```

**Response:**
```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### `POST /runs/{run_id}/execute`

Execute Pipeline A (blog generation).

**Response:**
```json
{
  "run_id": "...",
  "status": "DONE",
  "steps": {
    "research": { /* ... */ },
    "drafts": [ /* ... */ ],
    "fact_checks": [ /* ... */ ],
    "final": { "markdown": "..." }
  },
  "citations": [ /* ... */ ],
  "logs": [ /* ... */ ]
}
```

---

#### `GET /runs/{run_id}`

Retrieve run state and outputs.

**Response:** Same as execute endpoint

---

#### `POST /runs/{run_id}/feedback`

Submit feedback and re-run from specific stage.

**Request:**
```json
{
  "stage": "writer",
  "feedback": "Please emphasize security features more"
}
```

**Response:** Updated run state

---

#### `POST /runs/{run_id}/linkedin`

Execute Pipeline B (LinkedIn pack generation).

**Response:**
```json
{
  "linkedin_pack": {
    "claims_check": {
      "safe_claims": ["..."],
      "risky_claims": [{ "claim": "...", "risk_type": "...", "suggestion": "..." }],
      "overall_assessment": "LOW_RISK"
    },
    "linkedin_post": {
      "post_text": "...",
      "hashtags": ["#ProductManagement", "..."],
      "cta": "Join our waitlist",
      "word_count": 187
    },
    "image_prompt": {
      "prompt": "...",
      "negative_prompt": "...",
      "model_suggestion": "SDXL-Lightning",
      "style_notes": "..."
    },
    "image_url": "https://cdn.leonardo.ai/..."
  }
}
```

---

#### `GET /runs/{run_id}/pdf`

Export blog as PDF with citations.

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="blog-{run_id}.pdf"

<binary PDF data>
```

---

## Setup & Installation

### Prerequisites

- **Python**: 3.11+ (3.12 recommended)
- **Node.js**: 18+ (20 LTS recommended)
- **API Keys**: At least one of Groq or Gemini

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
# LLM Providers (need at least one)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Optional services
SERPER_API_KEY=...           # For web search
LEONARDO_API_KEY=...         # For image generation
EOL

# Run server
uvicorn app.main:app --reload --port 8000
```

**Verify**: Open http://localhost:8000/docs for Swagger UI

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8000
EOL

# Run dev server
npm run dev
```

**Verify**: Open http://localhost:3000

---

## Configuration

### Model Configuration

**Default Models** (set in `backend/app/crew/crew.py`):
```python
DEFAULT_GROQ_MODEL = "groq/llama-3.1-8b-instant"
DEFAULT_GEMINI_MODEL = "gemini/gemini-2.5-flash"
```

**Override via Environment**:
```bash
MODEL=groq/llama-3.3-70b-versatile  # Global override
```

**Override via Frontend**: Select model from dropdown before generating

### Agent Temperature Settings

| Agent | Temperature | Reasoning |
|-------|-------------|-----------|
| Researcher | 0.5 | Balanced for fact extraction |
| Writer | 0.5 | Creative but focused |
| Fact Checker | 0.2 | Conservative for consistency |
| Style Editor | 0.5 | Balanced for readability |
| Claims Analyst | 0.2 | Conservative for compliance |
| LinkedIn Writer | 0.6 | More creative for engagement |
| Prompt Engineer | 0.5 | Balanced |

### YAML Configuration Files

**Agent Definitions** (`backend/app/crew/config/agents.yaml`):
```yaml
researcher:
  role: "Product Researcher"
  goal: "Extract facts from PRD with source IDs"
  backstory: "You extract facts and return JSON with source IDs S0, S1, S2..."
  verbose: true
```

**Task Definitions** (`backend/app/crew/config/tasks.yaml`):
```yaml
research_task:
  description: >
    PRD: {prd}
    Return JSON: {...}
  expected_output: "JSON with sources array"
  agent: researcher
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | One required | Groq API access |
| `GEMINI_API_KEY` | One required | Google Gemini API access |
| `SERPER_API_KEY` | Optional | Web search capability |
| `LEONARDO_API_KEY` | Optional | Image generation |
| `MODEL` | Optional | Global model override |

---

## Deployment

### Production Considerations

1. **Database Migration**: Replace JSON storage with PostgreSQL/MongoDB
2. **File Storage**: Move uploads to S3/Azure Blob
3. **Rate Limiting**: Implement per-user API quotas
4. **Caching**: Add Redis for LLM response caching
5. **Monitoring**: Integrate Sentry for error tracking
6. **Queue System**: Use Celery for long-running tasks
7. **Load Balancing**: Deploy multiple backend instances
8. **CDN**: Use Vercel Edge for frontend

### Docker Deployment

```bash
# Backend
docker build -t shinrai-backend ./backend
docker run -p 8000:8000 --env-file .env shinrai-backend

# Frontend
docker build -t shinrai-frontend ./frontend
docker run -p 3000:3000 shinrai-frontend
```

### Environment Production Settings

```bash
# Backend
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SENTRY_DSN=...

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=...
```

---

## Project Structure

```
shinrai/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app and routes
│   │   ├── crew/
│   │   │   ├── crew.py                # Pipeline A (Blog) crew
│   │   │   ├── linkedin_crew.py       # Pipeline B (LinkedIn) crew
│   │   │   ├── schemas.py             # Pydantic models
│   │   │   └── config/
│   │   │       ├── agents.yaml        # Agent definitions
│   │   │       ├── tasks.yaml         # Task definitions
│   │   │       ├── linkedin_agents.yaml
│   │   │       └── linkedin_tasks.yaml
│   │   ├── services/
│   │   │   ├── orchestrator.py        # Pipeline A orchestration
│   │   │   ├── linkedin_orchestrator.py  # Pipeline B orchestration
│   │   │   ├── leonardo_service.py    # Leonardo AI integration
│   │   │   └── run_store.py           # State persistence
│   │   ├── tools/
│   │   │   └── search_tool.py         # SerperDevTool wrapper
│   │   └── utils/
│   │       ├── file_upload.py         # File processing
│   │       ├── json_guardrails.py     # JSON validation
│   │       ├── pdf_generator.py       # PDF export
│   │       └── pdf_export.py          # Legacy PDF utils
│   ├── data/runs/                     # Run state storage
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # Home page (PRD input)
│   │   ├── layout.tsx                 # Root layout
│   │   ├── globals.css                # Global styles
│   │   └── runs/[runId]/
│   │       ├── page.tsx               # Run details page
│   │       └── linkedin/page.tsx      # LinkedIn pack page
│   ├── components/
│   │   ├── Features.tsx               # Feature showcase
│   │   ├── FeedbackModal.tsx          # User feedback UI
│   │   ├── FileUpload.tsx             # File upload component
│   │   ├── HowItWorks.tsx             # Process explanation
│   │   ├── IssuesTable.tsx            # Fact-check issues display
│   │   ├── LinkedInPackModal.tsx      # LinkedIn content modal
│   │   ├── MarkdownViewer.tsx         # Blog renderer
│   │   ├── SourcesList.tsx            # Citations display
│   │   ├── StepCard.tsx               # Pipeline step UI
│   │   ├── TemplateLibrary.tsx        # PRD templates
│   │   └── Timeline.tsx               # Progress timeline
│   ├── lib/
│   │   ├── api.ts                     # API client functions
│   │   ├── templates.ts               # PRD template data
│   │   ├── types.ts                   # TypeScript interfaces
│   │   └── utils.ts                   # Utility functions
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## Troubleshooting

### Common Issues

**Issue**: "SERPER_API_KEY not found"  
**Solution**: Web search only works with Gemini models. Select a Gemini model or disable web search.

**Issue**: "Rate limit exceeded"  
**Solution**: Automatic fallback should handle this. Check logs for model switches. Consider upgrading API plan.

**Issue**: "PDF generation failed"  
**Solution**: WeasyPrint requires system libraries. On Windows, see `backend/WINDOWS_SETUP.md`.

**Issue**: "Leonardo AI timeout"  
**Solution**: Image generation can take 10-30 seconds. Increase timeout or check Leonardo API status.

**Issue**: "Fact checker keeps failing"  
**Solution**: Writer may be making unsupported claims. Check fact-check issues for specific guidance. Try different model (70B vs 8B).

### Debugging Tips

1. **Check Logs**: Each run has `data/runs/{run_id}/logs.txt`
2. **Inspect State**: View `data/runs/{run_id}/state.json` for raw outputs
3. **API Docs**: Use FastAPI Swagger UI at `/docs` for testing endpoints
4. **Frontend Logs**: Check browser console for API errors
5. **Model Selection**: Try switching between Groq and Gemini if issues persist

---

## Future Enhancements

- [ ] **Database Integration**: PostgreSQL for production scalability
- [ ] **Authentication**: User accounts with run history
- [ ] **Batch Processing**: Queue system for multiple runs
- [ ] **Advanced Citations**: APA/MLA format support
- [ ] **Multi-language Support**: I18n for global users
- [ ] **Analytics Dashboard**: Usage metrics and insights
- [ ] **Slack Integration**: Post LinkedIn content directly
- [ ] **Custom Templates**: User-defined PRD templates
- [ ] **Version Control**: Git-style diffing for blog revisions
- [ ] **Collaborative Editing**: Real-time multi-user sessions

---

## License

MIT License - See LICENSE file for details

---

## Project Name

**Shinrai** (信頼) - Japanese for "trust" and "reliability"  
Reflecting the platform's commitment to fact-checked, trustworthy content generation.

---

## Advanced Features

### 1. Template Library

Pre-built PRD templates for quick testing and reference:
- **Task Management App** (127 words) - Mobile productivity tool
- **AI Writing Assistant** (156 words) - Chrome extension for content improvement
- **Analytics Dashboard** (234 words) - Real-time data visualization platform
- **E-Learning Platform** (312 words) - Course delivery system
- **Enterprise CRM** (502 words) - Customer relationship management with AI

### 2. PDF Export with Styling

**Features:**
- Professional typography (system fonts: Georgia, Arial)
- Styled headings (H1: 28px, H2: 22px, H3: 18px)
- Preserved citations in footnote format
- Automatic page breaks and margins
- Syntax highlighting for code blocks

**Tech Stack:**
```python
# Backend: WeasyPrint for HTML → PDF
from weasyprint import HTML, CSS

html_template = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 40px auto; }}
    h1 {{ font-size: 28px; color: #1a202c; margin-top: 0; }}
    h2 {{ font-size: 22px; color: #2d3748; border-bottom: 2px solid #e2e8f0; }}
    code {{ background: #f7fafc; padding: 2px 6px; border-radius: 3px; }}
  </style>
</head>
<body>{markdown_to_html(content)}</body>
</html>
"""
pdf_bytes = HTML(string=html_template).write_pdf()
```

**Windows Limitation:** Requires GTK+ runtime (see [Troubleshooting](#troubleshooting))

### 3. Pipeline Stage Editing

**NEW: Feedback & Re-run Feature**

Users can now provide feedback at any stage and re-run the pipeline from that point forward!

**How It Works:**

1. **Feedback Modal:**
   ```typescript
   // Click "✏️ Edit" button on any completed stage
   <FeedbackModal
     isOpen={true}
     stageName="writer"
     stageTitle="Writer"
     onSubmit={(feedback) => submitFeedback(runId, "writer", feedback)}
   />
   ```

2. **Backend Re-run Logic:**
   ```python
   @app.post("/runs/{run_id}/feedback")
   async def submit_feedback(run_id: str, req: SubmitFeedbackRequest):
       # Stage: "researcher", "writer", "fact_checker", or "style_editor"
       # Re-run from that stage forward with user feedback
       result = await run_pipeline_with_feedback(run_id, state, store, stage, feedback)
   ```

3. **Re-execution Flow:**
   - **Researcher feedback:** Re-runs researcher → writer → fact-checker → style editor
   - **Writer feedback:** Re-runs writer → fact-checker → style editor (keeps research)
   - **Fact-checker feedback:** Re-runs fact-checker → style editor (keeps draft)
   - **Style editor feedback:** Re-runs style editor only

**Use Cases:**
- "Add more technical depth to the research"
- "Make the tone more casual and friendly"
- "Fix the citation format issues"
- "Polish the introduction paragraph"

---

## Frontend Components

### Architecture

```
app/
├── page.tsx                    # Home page (PRD input form)
├── runs/[runId]/
│   └── page.tsx                # Timeline viewer (dynamic route)
└── layout.tsx                  # Root layout

components/
├── Timeline.tsx                # 4-step vertical timeline
├── StepCard.tsx                # Collapsible card for each agent step
├── SourcesList.tsx             # Research sources table
├── IssuesTable.tsx             # Fact-check issues table
├── MarkdownViewer.tsx          # Blog preview with syntax highlighting
└── StatusBadge.tsx             # Color-coded status indicator

lib/
├── api.ts                      # Backend API client
└── types.ts                    # TypeScript interfaces (mirrors backend schemas)
```

### Key Component Details

#### Timeline.tsx
**Purpose:** Display 4 sequential steps with live status updates

**State Management:**
```typescript
const [activeDraft, setActiveDraft] = useState<number>(0); // Draft tab selection
```

**Rendering Logic:**
- **Step 1 (Research):** Shows `SourcesList` component if completed
- **Step 2 (Write):** Tabs for each draft iteration + `MarkdownViewer`
- **Step 3 (Fact-Check):** `IssuesTable` for each iteration + pass/fail badge
- **Step 4 (Polish):** Final blog preview + download buttons

**Conditional Expansion:**
- Auto-expands currently running step
- Previously completed steps stay collapsed (can manually expand)

#### StepCard.tsx
**Props:**
```typescript
{
  title: string,
  status: "pending" | "running" | "completed" | "failed",
  startTime?: string,
  endTime?: string,
  expanded: boolean,
  onToggle: () => void,
  children: ReactNode
}
```

**Features:**
- Animated chevron icon (rotates on expand/collapse)
- Color-coded left border (green=completed, blue=running, gray=pending, red=failed)
- Execution time badge (if completed)

#### LinkedInPackModal.tsx
**Purpose:** Display generated social content and image control.

**Features:**
- **Tabs:** Switch between "LinkedIn Post" and "Image Generator"
- **Live Preview:** See the generated image and text
- **One-Click Actions:** "Copy Text", "Generate Image", "Download"

#### MarkdownViewer.tsx
**Dependencies:**
- `react-markdown` – Converts Markdown to React elements
- `remark-gfm` – GitHub Flavored Markdown support (tables, strikethrough, task lists)

**Custom Styling:**
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mb-3" {...props} />,
    code: ({node, inline, ...props}) => (
      inline 
        ? <code className="bg-gray-100 px-1 rounded" {...props} />
        : <code className="block bg-gray-900 text-white p-4 rounded" {...props} />
    ),
    a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />
  }}
>
  {content}
</ReactMarkdown>
```

**Citation Highlighting:**
Citations like `[S1]` are rendered as inline `<sup>` tags styled in blue.

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with clear messages
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Coding Standards:**
- Backend: Black formatter, type hints required
- Frontend: Prettier, ESLint (Airbnb style guide)
- Tests: pytest for backend, Jest for frontend

---

## Acknowledgments

- **CrewAI** – Brilliant multi-agent framework
- **Groq** – Blazing-fast LLM inference
- **Google Gemini** – Advanced AI with function calling support
- **Leonardo AI** – High-quality image generation
- **Vercel** – Seamless Next.js deployment
- **Tailwind Labs** – Beautiful utility-first CSS

---

**Built with ❤️ for the AI Hackathon 2024**
