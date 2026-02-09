"""CrewAI crew definition – official @CrewBase pattern with YAML config."""
from __future__ import annotations

import os
from pathlib import Path

import yaml
from crewai import Agent, Crew, Task, LLM, Process
from crewai.project import CrewBase, agent, crew, task

CONFIG_DIR = Path(__file__).resolve().parent / "config"

# Model configuration with free tier optimization
DEFAULT_GROQ_MODEL = "groq/llama-3.1-8b-instant"  # Fastest for free tier
DEFAULT_GEMINI_MODEL = "gemini/gemini-2.5-flash"  # Free tier with tools support


def _load_yaml(name: str) -> dict:
    with open(CONFIG_DIR / name, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _get_model_name(model_override: str | None = None) -> str:
    """Detect which model to use based on override or env vars."""
    # Use override if provided (from frontend selection)
    if model_override:
        return model_override
    
    # Check for explicit MODEL env var first
    model = os.getenv("MODEL")
    if model:
        return model
    
    # Check for legacy GROQ_MODEL
    model = os.getenv("GROQ_MODEL")
    if model:
        return model
    
    # Auto-detect based on API keys available
    if os.getenv("GEMINI_API_KEY"):
        return DEFAULT_GEMINI_MODEL
    elif os.getenv("GROQ_API_KEY"):
        return DEFAULT_GROQ_MODEL
    else:
        # Default to Groq
        return DEFAULT_GROQ_MODEL


def _is_gemini_model(model: str) -> bool:
    """Check if model is a Gemini model."""
    return model.startswith("gemini/")


def _get_llm(temperature: float = 0.5, model_override: str | None = None) -> LLM:
    """Get LLM with optimized settings for free tier."""
    model = _get_model_name(model_override)
    
    # Ensure API keys are available in environment for LiteLLM
    if _is_gemini_model(model):
        # LiteLLM expects GEMINI_API_KEY or GOOGLE_API_KEY in environment
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if gemini_key:
            # Set both for compatibility
            os.environ["GEMINI_API_KEY"] = gemini_key
            os.environ["GOOGLE_API_KEY"] = gemini_key
    
    # Free tier optimization: minimal token usage
    llm_config = {
        "model": model,
        "temperature": temperature,
    }
    
    # Gemini-specific optimizations for free tier
    if _is_gemini_model(model):
        llm_config.update({
            "max_tokens": 2048,  # Limit output to save tokens
            "top_p": 0.9,
            "top_k": 40,
        })
    
    return LLM(**llm_config)


def _get_llm_with_fallback(temperature: float = 0.5, retry_index: int = 0, model_override: str | None = None) -> LLM:
    """Get LLM (no fallback needed for stable free tier models)."""
    # For free tier, we use stable models without fallback complexity
    # Just return the configured LLM
    return _get_llm(temperature, model_override)


@CrewBase
class PrdBlogCrew:
    """PRD → Blog multi-agent crew with 4 specialized agents."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    def __init__(self, model_override: str | None = None):
        """Initialize crew with optional model override."""
        self.model_override = model_override

    # ── Agents ───────────────────────────────────────────────────────────

    @agent
    def researcher(self) -> Agent:
        return Agent(
            config=self.agents_config["researcher"],  # type: ignore[index]
            llm=_get_llm(0.5, self.model_override),
            allow_delegation=False,
        )

    @agent
    def writer(self) -> Agent:
        return Agent(
            config=self.agents_config["writer"],  # type: ignore[index]
            llm=_get_llm(0.5, self.model_override),
            allow_delegation=False,
        )

    @agent
    def fact_checker(self) -> Agent:
        return Agent(
            config=self.agents_config["fact_checker"],  # type: ignore[index]
            llm=_get_llm(0.2, self.model_override),
            allow_delegation=False,
        )

    @agent
    def polisher(self) -> Agent:
        return Agent(
            config=self.agents_config["polisher"],  # type: ignore[index]
            llm=_get_llm(0.5, self.model_override),
            allow_delegation=False,
        )

    # ── Tasks ────────────────────────────────────────────────────────────

    @task
    def research_task(self) -> Task:
        return Task(
            config=self.tasks_config["research_task"],  # type: ignore[index]
        )

    @task
    def write_task(self) -> Task:
        return Task(
            config=self.tasks_config["write_task"],  # type: ignore[index]
        )

    @task
    def fact_check_task(self) -> Task:
        return Task(
            config=self.tasks_config["fact_check_task"],  # type: ignore[index]
        )

    @task
    def polish_task(self) -> Task:
        return Task(
            config=self.tasks_config["polish_task"],  # type: ignore[index]
        )

    # ── Full crew (reference – orchestrator uses kickoff_step instead) ───

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,  # auto-collected by @agent decorator
            tasks=self.tasks,    # auto-collected by @task decorator
            process=Process.sequential,
            verbose=True,
        )

    # ── Helper: run a single task as a mini-crew ─────────────────────────
    # The orchestrator needs to run steps individually for the fact-check
    # loop, so we build a one-task Crew and kickoff with variable inputs.

    def kickoff_step(self, task_key: str, inputs: dict, retry_count: int = 0) -> str:
        """Run a single task identified by its YAML key with model fallback on rate limits."""
        # Load raw YAML config directly
        tasks_yaml = _load_yaml("tasks.yaml")
        task_cfg = tasks_yaml[task_key]
        agent_name = task_cfg["agent"]
        
        # Get the agent instance by calling the method
        agent_instance = getattr(self, agent_name)()

        # On retries, update agent's LLM to use fallback model
        if retry_count > 0:
            temp = 0.2 if agent_name == "fact_checker" else 0.5
            agent_instance.llm = _get_llm_with_fallback(temp, retry_count)

        single_task = Task(
            description=task_cfg["description"],
            expected_output=task_cfg["expected_output"],
            agent=agent_instance,
        )
        mini_crew = Crew(
            agents=[agent_instance],
            tasks=[single_task],
            process=Process.sequential,
            verbose=True,
        )
        
        try:
            result = mini_crew.kickoff(inputs=inputs)
            return str(result)
        except Exception as e:
            error_str = str(e).lower()
            # Check if it's a rate limit error
            if ("rate_limit" in error_str or "rate limit" in error_str) and retry_count < len(GROQ_MODEL_FALLBACKS) - 1:
                # Retry with next fallback model
                return self.kickoff_step(task_key, inputs, retry_count + 1)
            else:
                # Not a rate limit or exhausted fallbacks
                raise
