"""Leonardo AI Image Generation Service using direct API calls."""
from __future__ import annotations

import os
import asyncio
import logging
import time
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)


class LeonardoService:
    """Service for generating images using Leonardo AI REST API."""
    
    BASE_URL = "https://cloud.leonardo.ai/api/rest/v1"
    
    # Popular Leonardo model IDs
    MODELS = {
        "kino_xl": "aa77f04e-3eec-4034-9c07-d0f619684628",  # Leonardo Kino XL (photorealistic)
        "vision_xl": "5c232a9e-9061-4777-980a-ddc8e65647c6",  # Leonardo Vision XL
        "anime_xl": "e71a1c2f-4f80-4800-934f-2c68979d8cc8",  # Leonardo Anime XL
        "diffusion_xl": "1e60896f-3c26-4296-8ecc-53e2afecc132",  # Leonardo Diffusion XL
    }
    
    DEFAULT_MODEL = MODELS["kino_xl"]  # Photorealistic by default
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Leonardo service with API key."""
        self.api_key = api_key or os.getenv("LEONARDO_API_KEY") or os.getenv("LEONARNDO_API_KEY")
        if not self.api_key:
            raise ValueError("Leonardo API key not found. Set LEONARDO_API_KEY in .env")
        
        self.headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {self.api_key}"
        }
        logger.info("Leonardo AI service initialized with direct API access")
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        model_id: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        guidance_scale: float = 7.0,
        num_images: int = 1,
    ) -> Dict[str, Any]:
        """
        Generate an image using Leonardo AI REST API.
        
        Args:
            prompt: The text prompt describing the image to generate
            negative_prompt: What to avoid in the image
            model_id: The Leonardo model ID to use (defaults to Kino XL)
            width: Image width in pixels
            height: Image height in pixels
            guidance_scale: How closely to follow the prompt (1-20, default 7)
            num_images: Number of variations to generate
            
        Returns:
            Dictionary containing generation_id and image URLs
        """
        model_id = model_id or self.DEFAULT_MODEL
        
        logger.info(f"Generating image with prompt: {prompt[:100]}...")
        logger.info(f"Model: {model_id}, Size: {width}x{height}")
        
        try:
            # Create generation request
            payload = {
                "prompt": prompt,
                "modelId": model_id,
                "width": width,
                "height": height,
                "num_images": num_images,
                "guidance_scale": guidance_scale,
            }
            
            if negative_prompt:
                payload["negative_prompt"] = negative_prompt
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Step 1: Create generation
                response = await client.post(
                    f"{self.BASE_URL}/generations",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                generation_id = result.get("sdGenerationJob", {}).get("generationId")
                if not generation_id:
                    raise ValueError(f"No generation ID in response: {result}")
                
                logger.info(f"Generation started with ID: {generation_id}")
                
                # Step 2: Poll for completion (max 60 seconds)
                max_attempts = 30
                for attempt in range(max_attempts):
                    await asyncio.sleep(2)  # Wait 2 seconds between polls
                    
                    response = await client.get(
                        f"{self.BASE_URL}/generations/{generation_id}",
                        headers=self.headers
                    )
                    response.raise_for_status()
                    gen_data = response.json()
                    
                    generated_images = gen_data.get("generations_by_pk", {}).get("generated_images", [])
                    status = gen_data.get("generations_by_pk", {}).get("status")
                    
                    if status == "COMPLETE" and generated_images:
                        image_urls = [img["url"] for img in generated_images if img.get("url")]
                        logger.info(f"Successfully generated {len(image_urls)} image(s)")
                        
                        return {
                            "generation_id": generation_id,
                            "images": image_urls,
                            "status": "success",
                            "result": gen_data,
                        }
                    elif status == "FAILED":
                        raise ValueError(f"Generation failed: {gen_data}")
                    
                    logger.debug(f"Generation attempt {attempt + 1}/{max_attempts}, status: {status}")
                
                # Timeout
                raise TimeoutError(f"Generation {generation_id} did not complete in time")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Leonardo API: {e.response.status_code} - {e.response.text}")
            return {
                "generation_id": None,
                "images": [],
                "status": "failed",
                "error": f"API error: {e.response.status_code}",
            }
        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            return {
                "generation_id": None,
                "images": [],
                "status": "failed",
                "error": str(e),
            }


# Alias for backward compatibility
LEONARDO_MODELS = LeonardoService.MODELS
