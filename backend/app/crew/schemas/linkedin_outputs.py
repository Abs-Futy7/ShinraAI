"""Pydantic output schemas for LinkedIn Pack tasks."""

from typing import List, Optional
from pydantic import BaseModel, Field


class RiskyClaim(BaseModel):
    """A risky marketing claim with suggested alternative."""
    claim: str = Field(..., description="The original risky claim text")
    risk_type: str = Field(..., description="Type of risk: superlative, guarantee, stat, etc.")
    suggestion: str = Field(..., description="Safer alternative wording")


class LinkedInClaimsOutput(BaseModel):
    """Output from the Claims Agent."""
    safe_claims: List[str] = Field(default_factory=list, description="Claims that are safe to use")
    risky_claims: List[RiskyClaim] = Field(default_factory=list, description="Claims that need revision")
    overall_assessment: str = Field(..., description="LOW_RISK, MEDIUM_RISK, or HIGH_RISK")


class LinkedInPostOutput(BaseModel):
    """Output from the LinkedIn Post Agent."""
    post_text: str = Field(..., description="The complete LinkedIn post text")
    hashtags: List[str] = Field(default_factory=list, description="Relevant hashtags for the post")
    cta: str = Field(..., description="Call-to-action text")
    word_count: int = Field(..., description="Number of words in the post")


class ImagePromptOutput(BaseModel):
    """Output from the Image Prompt Agent."""
    prompt: str = Field(..., description="Optimized prompt for image generation")
    negative_prompt: str = Field(..., description="What to avoid in the image")
    model_suggestion: str = Field(default="SDXL-Lightning", description="Recommended AI model")
    style_notes: Optional[str] = Field(None, description="Description of expected visual outcome")
