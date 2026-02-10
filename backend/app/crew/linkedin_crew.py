"""LinkedIn Pack Crew - Pipeline B for social media content generation."""
from __future__ import annotations

import os
from pathlib import Path

import yaml
from crewai import Agent, Crew, Task, LLM, Process
from crewai.project import CrewBase, agent, crew, task

from app.crew.schemas.linkedin_outputs import (
    LinkedInClaimsOutput,
    LinkedInPostOutput,
    ImagePromptOutput,
)

CONFIG_DIR = Path(__file__).resolve().parent / "config"


def _load_yaml(name: str) -> dict:
    with open(CONFIG_DIR / name, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _get_model_name(model_override: str | None = None) -> str:
    """Force Groq models for LinkedIn pack to avoid API limits."""
    # ALWAYS use Groq for LinkedIn pack (lower API limits)
    # Ignore model_override to enforce Groq usage
    return "groq/llama-3.1-8b-instant"


def _is_gemini_model(model: str) -> bool:
    """Check if model is a Gemini model."""
    return model.startswith("gemini/")


def _get_llm(temperature: float = 0.5, model_override: str | None = None) -> LLM:
    """Get LLM with optimized settings for free tier."""
    model = _get_model_name(model_override)
    
    # Free tier optimization: minimal token usage
    llm_config = {
        "model": model,
        "temperature": temperature,
    }
    
    # Gemini-specific optimizations for free tier
    if _is_gemini_model(model):
        # Explicit API key for Gemini models
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            llm_config["api_key"] = api_key
        
        llm_config.update({
            "max_tokens": 2048,  # Limit output to save tokens
            "top_p": 0.9,
            "top_k": 40,
        })
    
    return LLM(**llm_config)


@CrewBase
class LinkedInPackCrew:
    """LinkedIn Pack multi-agent crew for Pipeline B."""

    agents_config = "config/linkedin_agents.yaml"
    tasks_config = "config/linkedin_tasks.yaml"

    def __init__(self, model_override: str | None = None):
        """Initialize crew - always uses Groq for LinkedIn pack."""
        # Force Groq regardless of override
        self.model_override = "groq/llama-3.1-8b-instant"

    # ── Agents ───────────────────────────────────────────────────────────

    @agent
    def claims_agent(self) -> Agent:
        """Compliance agent - runs FIRST to flag risky claims."""
        return Agent(
            config=self.agents_config["claims_agent"],  # type: ignore[index]
            llm=_get_llm(0.2, self.model_override),  # Conservative - consistent flagging
            allow_delegation=False,
        )

    @agent
    def linkedin_post_agent(self) -> Agent:
        """LinkedIn content strategist - creates platform-optimized post."""
        return Agent(
            config=self.agents_config["linkedin_post_agent"],  # type: ignore[index]
            llm=_get_llm(0.6, self.model_override),  # More creative for engaging copy
            allow_delegation=False,
        )

    @agent
    def image_prompt_agent(self) -> Agent:
        """AI image prompt engineer - generates SDXL-optimized prompts."""
        return Agent(
            config=self.agents_config["image_prompt_agent"],  # type: ignore[index]
            llm=_get_llm(0.5, self.model_override),  # Balanced creativity
            allow_delegation=False,
        )

    # ── Tasks ────────────────────────────────────────────────────────────

    @task
    def claims_check_task(self) -> Task:
        """Task 1: Analyze blog for risky marketing claims."""
        return Task(
            config=self.tasks_config["claims_check_task"],  # type: ignore[index]
            agent=self.claims_agent(),
            output_pydantic=LinkedInClaimsOutput,
        )

    @task
    def linkedin_post_task(self) -> Task:
        """Task 2: Generate LinkedIn post avoiding risky claims."""
        return Task(
            config=self.tasks_config["linkedin_post_task"],  # type: ignore[index]
            agent=self.linkedin_post_agent(),
            output_pydantic=LinkedInPostOutput,
        )

    @task
    def image_prompt_task(self) -> Task:
        """Task 3: Create optimized image generation prompt."""
        return Task(
            config=self.tasks_config["image_prompt_task"],  # type: ignore[index]
            agent=self.image_prompt_agent(),
            output_pydantic=ImagePromptOutput,
        )

    # ── Crew ─────────────────────────────────────────────────────────────

    @crew
    def crew(self) -> Crew:
        """Assemble the LinkedIn Pack crew with sequential execution."""
        return Crew(
            agents=self.agents,  # type: ignore[arg-type]
            tasks=self.tasks,    # type: ignore[arg-type]
            process=Process.sequential,
            verbose=True,
        )
