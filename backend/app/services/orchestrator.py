"""Pipeline orchestrator – runs agents in sequence with fact-check loop."""
from __future__ import annotations

import asyncio
import json
import os
import traceback
from typing import Any, Dict

from app.crew.crew import PrdBlogCrew
from app.services.run_store import RunStore
from app.utils.json_guardrails import extract_json, validate_research, validate_fact_check

MAX_FACT_CHECK_RETRIES = 2


async def run_pipeline(run_id: str, state: dict, store: RunStore) -> dict:
    """Execute the full PRD → Blog pipeline."""
    store.set_status(run_id, "RUNNING")
    inputs = state["inputs"]

    prd = inputs["prd"]
    tone = inputs.get("tone", "professional")
    audience = inputs.get("audience", "engineers")
    word_count = inputs.get("word_count", 800)
    use_web_search = inputs.get("use_web_search", False)
    model_provider = inputs.get("model_provider", "groq")
    model_name = inputs.get("model_name", "groq/llama-3.1-8b-instant")

    # ── Build crew instance ───────────────────────────────────────────────
    crew_instance = PrdBlogCrew(model_override=model_name)

    # Optionally attach web-search tool to the researcher agent
    # NOTE: Web search only works with Gemini models (function calling support)
    if use_web_search and os.getenv("SERPER_API_KEY"):
        is_gemini = model_provider == "gemini"
        
        if is_gemini:
            try:
                from app.tools.search_tool import get_serper_tool
                crew_instance.researcher().tools = [get_serper_tool()]
                store.log(run_id, f"✓ Web search enabled (SerperDevTool with {model_name})")
            except Exception as e:
                store.log(run_id, f"⚠ SerperDevTool unavailable: {str(e)}")
        else:
            store.log(run_id, "⚠ Web search disabled: Only supported with Gemini models")
            store.log(run_id, "💡 To enable web search, select a Gemini model in the frontend")

    store.log(run_id, f"Crew built (PrdBlogCrew with {model_name})")

    # ── Step 1: Research ──────────────────────────────────────────────────
    store.log(run_id, "▶ Step 1: Researcher starting")
    research_raw = await _kickoff(crew_instance, "research_task", {"prd": prd}, store, run_id)

    research_dict = extract_json(research_raw)
    if not validate_research(research_dict):
        store.log(run_id, "⚠ Research output validation soft-failed, proceeding")
        if research_dict is None:
            research_dict = {
                "queries": [],
                "sources": [{"id": "S0", "title": "PRD", "url": "internal://prd", "query": "", "key_facts": [prd[:500]]}],
                "summary_facts": [prd[:500]],
                "unknowns": [],
            }

    store.update_steps(run_id, "research", research_dict)
    citations = [
        {"id": s["id"], "title": s.get("title", ""), "url": s.get("url", "")}
        for s in research_dict.get("sources", [])
    ]
    store.set_citations(run_id, citations)
    store.log(run_id, f"✓ Research done – {len(research_dict.get('sources', []))} sources found")

    # ── Step 2–3: Write + Fact-Check loop ─────────────────────────────────
    research_json_for_prompt = json.dumps(research_dict, indent=2)
    draft_text = ""
    fact_passed = False
    iteration = 0
    revision_instructions = ""

    while iteration < (1 + MAX_FACT_CHECK_RETRIES):
        iteration += 1
        store.log(run_id, f"▶ Step 2: Writer iteration {iteration}")

        draft_text = await _kickoff(
            crew_instance, "write_task",
            {
                "prd": prd,
                "research_json": research_json_for_prompt,
                "tone": tone,
                "audience": audience,
                "word_count": str(word_count),
                "revision_instructions": revision_instructions,
            },
            store, run_id,
        )
        store.append_step(run_id, "drafts", {"iteration": iteration, "text": draft_text})
        store.log(run_id, f"✓ Draft {iteration} written ({len(draft_text)} chars)")

        # Fact-check
        store.log(run_id, f"▶ Step 3: Fact-Checker iteration {iteration}")
        fc_raw = await _kickoff(
            crew_instance, "fact_check_task",
            {
                "draft": draft_text,
                "research_json": research_json_for_prompt,
            },
            store, run_id,
        )
        fc_dict = extract_json(fc_raw)
        if fc_dict is None:
            fc_dict = {
                "passed": False,
                "issues": [{"claim": "parse error", "reason": "Could not parse fact-check output", "suggested_fix": "Retry", "source_ids": []}],
                "rewrite_instructions": "Please ensure all claims are properly cited.",
            }

        fc_passed = fc_dict.get("passed", False)
        fc_issues = fc_dict.get("issues", [])
        fc_rewrite = fc_dict.get("rewrite_instructions", "")

        store.append_step(run_id, "fact_checks", {
            "iteration": iteration,
            "passed": fc_passed,
            "issues": fc_issues,
            "rewrite_instructions": fc_rewrite,
        })
        store.log(run_id, f"{'✓' if fc_passed else '✗'} Fact-check {iteration}: passed={fc_passed}, issues={len(fc_issues)}")

        if fc_passed:
            fact_passed = True
            break
        else:
            if iteration < (1 + MAX_FACT_CHECK_RETRIES):
                revision_instructions = (
                    f"\n\n--- REVISION REQUIRED (iteration {iteration}) ---\n"
                    f"The fact-checker found issues. Rewrite instructions:\n{fc_rewrite}\n\n"
                    f"Issues:\n" + json.dumps(fc_issues, indent=2) +
                    "\n\nPlease fix ALL issues and ensure every claim is cited with [S#].\n"
                )
            else:
                store.log(run_id, "⚠ Max retries reached – proceeding with warnings")

    # ── Step 4: Polish ────────────────────────────────────────────────────
    store.log(run_id, "▶ Step 4: Style Polisher starting")
    final_md = await _kickoff(
        crew_instance, "polish_task",
        {
            "draft": draft_text,
            "tone": tone,
            "audience": audience,
        },
        store, run_id,
    )

    store.update_steps(run_id, "final", {"markdown": final_md})
    final_status = "DONE" if fact_passed else "DONE_WITH_WARNINGS"
    store.set_status(run_id, final_status)
    store.log(run_id, f"✓ Pipeline complete – status={final_status}")

    return store.load(run_id)


async def _kickoff(
    crew_instance: PrdBlogCrew,
    task_key: str,
    inputs: dict,
    store: RunStore,
    run_id: str,
) -> str:
    """Run a single CrewAI task via kickoff_step in a thread pool with auto-retry."""
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None, crew_instance.kickoff_step, task_key, inputs, 0
        )
        return result
    except Exception as e:
        error_str = str(e).lower()
        if "rate_limit" in error_str or "rate limit" in error_str:
            store.log(run_id, f"⚠ Rate limit hit in {task_key} - fallback chain exhausted")
        store.log(run_id, f"ERROR in {task_key}: {traceback.format_exc()}")
        raise


async def run_pipeline_with_feedback(
    run_id: str, 
    state: dict, 
    store: RunStore, 
    stage: str, 
    feedback: str
) -> dict:
    """
    Re-run pipeline from a specific stage with user feedback.
    
    Args:
        run_id: The run ID
        state: Current run state
        store: RunStore instance
        stage: Stage to resume from (researcher, writer, fact_checker, style_editor)
        feedback: User's feedback text
    
    Returns:
        Updated state dict
    """
    store.set_status(run_id, "RUNNING")
    store.log(run_id, f"🔄 Re-running from stage: {stage}")
    store.log(run_id, f"📝 User feedback: {feedback}")
    
    inputs = state["inputs"]
    prd = inputs["prd"]
    tone = inputs.get("tone", "professional")
    audience = inputs.get("audience", "engineers")
    word_count = inputs.get("word_count", 800)
    use_web_search = inputs.get("use_web_search", False)
    model_provider = inputs.get("model_provider", "groq")
    model_name = inputs.get("model_name", "groq/llama-3.1-8b-instant")
    
    # Build crew instance with model from original run
    crew_instance = PrdBlogCrew(model_override=model_name)
    
    # Only attach web search tools for Gemini models (Groq doesn't support function calling)
    if use_web_search and os.getenv("SERPER_API_KEY"):
        is_gemini = model_provider == "gemini"
        
        if is_gemini:
            try:
                from app.tools.search_tool import get_serper_tool
                crew_instance.researcher().tools = [get_serper_tool()]
            except Exception:
                pass
    
    # Get existing data
    steps = state.get("steps", {})
    research_dict = steps.get("research")
    
    # ── Re-run from specified stage ───────────────────────────────────────
    
    # If feedback is for researcher, re-run everything
    if stage == "researcher":
        store.log(run_id, "▶ Re-running Step 1: Researcher with feedback")
        research_task_inputs = {"prd": prd}
        if feedback:
            research_task_inputs["feedback"] = f"\n\nUSER FEEDBACK:\n{feedback}\n\nPlease incorporate this feedback in your research."
        
        research_raw = await _kickoff(crew_instance, "research_task", research_task_inputs, store, run_id)
        research_dict = extract_json(research_raw)
        if not validate_research(research_dict):
            store.log(run_id, "⚠ Research output validation soft-failed")
            if research_dict is None:
                research_dict = {
                    "queries": [],
                    "sources": [{"id": "S0", "title": "PRD", "url": "internal://prd", "query": "", "key_facts": [prd[:500]]}],
                    "summary_facts": [prd[:500]],
                    "unknowns": [],
                }
        
        store.update_steps(run_id, "research", research_dict)
        citations = [
            {"id": s["id"], "title": s.get("title", ""), "url": s.get("url", "")}
            for s in research_dict.get("sources", [])
        ]
        store.set_citations(run_id, citations)
        store.log(run_id, "✓ Research re-done with feedback")
    
    # Continue from writer stage
    if stage in ["researcher", "writer"]:
        research_json_for_prompt = json.dumps(research_dict, indent=2)
        
        # Prepare revision instructions with user feedback
        revision_instructions = ""
        if stage == "writer" and feedback:
            revision_instructions = f"\n\n--- USER FEEDBACK ---\n{feedback}\n\nPlease incorporate this feedback and revise accordingly.\n"
        
        store.log(run_id, "▶ Re-running Step 2: Writer with feedback")
        draft_text = await _kickoff(
            crew_instance, "write_task",
            {
                "prd": prd,
                "research_json": research_json_for_prompt,
                "tone": tone,
                "audience": audience,
                "word_count": str(word_count),
                "revision_instructions": revision_instructions,
            },
            store, run_id,
        )
        
        # Clear old drafts if re-running writer
        current_iteration = len(steps.get("drafts", [])) + 1
        store.append_step(run_id, "drafts", {"iteration": current_iteration, "text": draft_text})
        store.log(run_id, f"✓ Draft revised based on feedback ({len(draft_text)} chars)")
        
        # Re-run fact-checker
        store.log(run_id, "▶ Re-running Step 3: Fact-Checker")
        fc_raw = await _kickoff(
            crew_instance, "fact_check_task",
            {
                "draft": draft_text,
                "research_json": research_json_for_prompt,
            },
            store, run_id,
        )
        fc_dict = extract_json(fc_raw)
        if fc_dict is None:
            fc_dict = {"passed": True, "issues": [], "rewrite_instructions": ""}
        
        store.append_step(run_id, "fact_checks", {
            "iteration": current_iteration,
            "passed": fc_dict.get("passed", True),
            "issues": fc_dict.get("issues", []),
            "rewrite_instructions": fc_dict.get("rewrite_instructions", ""),
        })
        store.log(run_id, f"✓ Fact-check re-run: passed={fc_dict.get('passed', True)}")
    
    # If feedback is for fact_checker, just re-run fact-checker
    if stage == "fact_checker":
        # Get latest draft
        drafts = steps.get("drafts", [])
        if not drafts:
            raise Exception("No draft available to fact-check")
        
        latest_draft = drafts[-1]["text"]
        research_json_for_prompt = json.dumps(research_dict, indent=2)
        
        # Include user feedback in fact-check instructions
        fc_inputs = {
            "draft": latest_draft,
            "research_json": research_json_for_prompt,
        }
        if feedback:
            fc_inputs["additional_instructions"] = f"\n\nUSER FEEDBACK:\n{feedback}\n\nPlease pay special attention to these concerns.\n"
        
        store.log(run_id, "▶ Re-running Step 3: Fact-Checker with feedback")
        fc_raw = await _kickoff(crew_instance, "fact_check_task", fc_inputs, store, run_id)
        fc_dict = extract_json(fc_raw)
        if fc_dict is None:
            fc_dict = {"passed": True, "issues": [], "rewrite_instructions": ""}
        
        current_iteration = len(steps.get("fact_checks", [])) + 1
        store.append_step(run_id, "fact_checks", {
            "iteration": current_iteration,
            "passed": fc_dict.get("passed", True),
            "issues": fc_dict.get("issues", []),
            "rewrite_instructions": fc_dict.get("rewrite_instructions", ""),
        })
        store.log(run_id, "✓ Fact-check re-run with feedback")
        
        # Get draft for polishing
        draft_text = latest_draft
    else:
        # Get latest draft
        drafts = steps.get("drafts", [])
        draft_text = drafts[-1]["text"] if drafts else ""
    
    # Re-run style editor (always runs after any stage)
    polish_inputs = {
        "draft": draft_text,
        "tone": tone,
        "audience": audience,
    }
    if stage == "style_editor" and feedback:
        polish_inputs["revision_instructions"] = f"\n\nUSER FEEDBACK:\n{feedback}\n\nPlease incorporate this styling feedback.\n"
    
    store.log(run_id, "▶ Re-running Step 4: Style Editor")
    final_md = await _kickoff(crew_instance, "polish_task", polish_inputs, store, run_id)
    
    store.update_steps(run_id, "final", {"markdown": final_md})
    store.set_status(run_id, "DONE")
    store.log(run_id, "✓ Pipeline re-run complete with user feedback")
    
    return store.load(run_id)
