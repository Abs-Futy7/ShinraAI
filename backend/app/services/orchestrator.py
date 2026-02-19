"""Pipeline orchestrator for PRD to blog generation."""
from __future__ import annotations

import asyncio
import json
import os
import time
import traceback
from dataclasses import dataclass
from typing import Any, Optional

from app.crew.crew import PrdBlogCrew
from app.services.llm_client import call_llm
from app.services.run_repo import RunRepo
from app.services.run_store import RunStore
from app.utils.json_guardrails import extract_json, validate_research

MAX_FACT_CHECK_RETRIES = 2
RUBRIC_SCALE_MIN = 1.0
RUBRIC_SCALE_MAX = 5.0


@dataclass
class KickoffResult:
    text: str
    latency_ms: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


async def run_pipeline(
    run_id: str,
    state: dict[str, Any],
    store: RunStore,
    repo: Optional[RunRepo] = None,
) -> dict[str, Any]:
    """Execute the full PRD to blog pipeline."""
    await _set_status(run_id, store, "RUNNING", repo=repo)
    inputs = state["inputs"]

    prd = inputs["prd"]
    tone = inputs.get("tone", "professional")
    audience = inputs.get("audience", "engineers")
    word_count = inputs.get("word_count", 800)
    use_web_search = inputs.get("use_web_search", False)
    model_provider = inputs.get("model_provider") or "groq"
    model_name = inputs.get("model_name") or "groq/llama-3.1-8b-instant"

    crew_instance = PrdBlogCrew(model_override=model_name)

    if use_web_search and os.getenv("SERPER_API_KEY"):
        is_gemini = model_provider == "gemini"
        if is_gemini:
            try:
                from app.tools.search_tool import get_serper_tool

                crew_instance.research_tools = [get_serper_tool()]
                await _log(
                    run_id,
                    store,
                    f"Web search enabled (SerperDevTool with {model_name})",
                    repo=repo,
                )
            except Exception as exc:
                await _log(run_id, store, f"SerperDevTool unavailable: {str(exc)}", repo=repo, level="warning")
        else:
            await _log(run_id, store, "Web search disabled: only supported with Gemini models", repo=repo, level="warning")
            await _log(run_id, store, "To enable web search, select a Gemini model in the frontend", repo=repo)

    await _log(run_id, store, f"Crew built (PrdBlogCrew with {model_name})", repo=repo)

    web_search_instructions = ""
    if use_web_search and model_provider == "gemini" and os.getenv("SERPER_API_KEY"):
        web_search_instructions = (
            "Web search is ENABLED. Use the search tool to find current, reputable external sources. "
            "Include at least 3 external sources as S1+ with real URLs."
        )

    await _log(run_id, store, "Step 1: Researcher starting", repo=repo)
    research_result = await _run_step(
        run_id=run_id,
        step_name="researcher",
        iteration=1,
        task_key="research_task",
        task_inputs={
            "prd": prd,
            "web_search_instructions": web_search_instructions,
        },
        crew_instance=crew_instance,
        store=store,
        repo=repo,
        model_provider=model_provider,
        model_name=model_name,
    )
    research_raw = research_result.text

    research_dict = extract_json(research_raw)
    if not validate_research(research_dict):
        await _log(run_id, store, "Research output validation soft-failed, proceeding", repo=repo, level="warning")
        if research_dict is None:
            research_dict = {
                "queries": [],
                "sources": [
                    {
                        "id": "S0",
                        "title": "PRD",
                        "url": "internal://prd",
                        "query": "",
                        "key_facts": [prd[:500]],
                    }
                ],
                "summary_facts": [prd[:500]],
                "unknowns": [],
            }

    store.update_steps(run_id, "research", research_dict)
    citations = [
        {"id": source["id"], "title": source.get("title", ""), "url": source.get("url", "")}
        for source in research_dict.get("sources", [])
    ]
    store.set_citations(run_id, citations)
    await _log(
        run_id,
        store,
        f"Research done - {len(research_dict.get('sources', []))} sources found",
        repo=repo,
    )

    research_json_for_prompt = json.dumps(research_dict, indent=2)
    draft_text = ""
    fact_passed = False
    iteration = 0
    revision_instructions = ""

    while iteration < (1 + MAX_FACT_CHECK_RETRIES):
        iteration += 1
        await _log(run_id, store, f"Step 2: Writer iteration {iteration}", repo=repo)

        write_result = await _run_step(
            run_id=run_id,
            step_name="writer",
            iteration=iteration,
            task_key="write_task",
            task_inputs={
                "prd": prd,
                "research_json": research_json_for_prompt,
                "tone": tone,
                "audience": audience,
                "word_count": str(word_count),
                "revision_instructions": revision_instructions,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        draft_text = write_result.text
        store.append_step(run_id, "drafts", {"iteration": iteration, "text": draft_text})
        await _log(run_id, store, f"Draft {iteration} written ({len(draft_text)} chars)", repo=repo)

        await _log(run_id, store, f"Step 3: Fact-checker iteration {iteration}", repo=repo)
        fact_result = await _run_step(
            run_id=run_id,
            step_name="fact_checker",
            iteration=iteration,
            task_key="fact_check_task",
            task_inputs={
                "draft": draft_text,
                "research_json": research_json_for_prompt,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        fc_dict = _normalize_fact_check(extract_json(fact_result.text))

        fc_passed = bool(fc_dict.get("passed", False))
        fc_issues = fc_dict.get("issues", [])
        fc_rewrite = fc_dict.get("rewrite_instructions", "")

        store.append_step(
            run_id,
            "fact_checks",
            {
                "iteration": iteration,
                "passed": fc_passed,
                "issues": fc_issues,
                "rewrite_instructions": fc_rewrite,
            },
        )
        await _log(
            run_id,
            store,
            f"Fact-check {iteration}: passed={fc_passed}, issues={len(fc_issues)}",
            repo=repo,
        )

        if fc_passed:
            fact_passed = True
            break

        if iteration < (1 + MAX_FACT_CHECK_RETRIES):
            revision_instructions = (
                f"\n\n--- REVISION REQUIRED (iteration {iteration}) ---\n"
                f"The fact-checker found issues. Rewrite instructions:\n{fc_rewrite}\n\n"
                f"Issues:\n{json.dumps(fc_issues, indent=2)}\n\n"
                "Please fix ALL issues and ensure every claim is cited with [S#].\n"
            )
        else:
            await _log(run_id, store, "Max retries reached - proceeding with warnings", repo=repo, level="warning")

    final_md, fact_passed, rubric_result, review_required, rubric_attempts = await _finalize_with_quality_gate(
        run_id=run_id,
        store=store,
        repo=repo,
        crew_instance=crew_instance,
        draft_text=draft_text,
        prd=prd,
        tone=tone,
        audience=audience,
        word_count=word_count,
        research_json_for_prompt=research_json_for_prompt,
        model_provider=model_provider,
        model_name=model_name,
        fact_passed=fact_passed,
    )

    final_status = "DONE" if fact_passed and rubric_result.get("passed") and not review_required else "DONE_WITH_WARNINGS"
    await _set_status(run_id, store, final_status, repo=repo)
    if review_required:
        await _log(
            run_id,
            store,
            "Rubric threshold not met after retries. Escalating to human review.",
            repo=repo,
            level="warning",
        )
    await _log(
        run_id,
        store,
        f"Rubric: overall={rubric_result.get('scores', {}).get('overall', 0):.2f}/5, "
        f"passed={rubric_result.get('passed')}, attempts={rubric_attempts}",
        repo=repo,
    )
    await _log(run_id, store, f"Pipeline complete - status={final_status}", repo=repo)
    return store.load(run_id) or {}


async def run_pipeline_with_feedback(
    run_id: str,
    state: dict[str, Any],
    store: RunStore,
    stage: str,
    feedback: str,
    repo: Optional[RunRepo] = None,
) -> dict[str, Any]:
    """
    Re-run the pipeline from a specific stage with user feedback.
    """
    await _set_status(run_id, store, "RUNNING", repo=repo)
    await _log(run_id, store, f"Re-running from stage: {stage}", repo=repo)
    await _log(run_id, store, f"User feedback: {feedback}", repo=repo)

    inputs = state["inputs"]
    prd = inputs["prd"]
    tone = inputs.get("tone", "professional")
    audience = inputs.get("audience", "engineers")
    word_count = inputs.get("word_count", 800)
    use_web_search = inputs.get("use_web_search", False)
    model_provider = inputs.get("model_provider") or "groq"
    model_name = inputs.get("model_name") or "groq/llama-3.1-8b-instant"

    crew_instance = PrdBlogCrew(model_override=model_name)

    if use_web_search and os.getenv("SERPER_API_KEY"):
        is_gemini = model_provider == "gemini"
        if is_gemini:
            try:
                from app.tools.search_tool import get_serper_tool

                crew_instance.research_tools = [get_serper_tool()]
            except Exception:
                pass

    steps = state.get("steps", {})
    research_dict = steps.get("research")

    if stage == "researcher":
        await _log(run_id, store, "Re-running Step 1: Researcher with feedback", repo=repo)
        web_search_instructions = ""
        if use_web_search and model_provider == "gemini" and os.getenv("SERPER_API_KEY"):
            web_search_instructions = (
                "Web search is ENABLED. Use the search tool to find current, reputable external sources. "
                "Include at least 3 external sources as S1+ with real URLs."
            )

        research_task_inputs: dict[str, Any] = {
            "prd": prd,
            "web_search_instructions": web_search_instructions,
        }
        if feedback:
            research_task_inputs["feedback"] = (
                f"\n\nUSER FEEDBACK:\n{feedback}\n\n"
                "Please incorporate this feedback in your research."
            )

        research_result = await _run_step(
            run_id=run_id,
            step_name="researcher",
            iteration=1,
            task_key="research_task",
            task_inputs=research_task_inputs,
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        research_dict = extract_json(research_result.text)
        if not validate_research(research_dict):
            await _log(run_id, store, "Research output validation soft-failed", repo=repo, level="warning")
            if research_dict is None:
                research_dict = {
                    "queries": [],
                    "sources": [
                        {
                            "id": "S0",
                            "title": "PRD",
                            "url": "internal://prd",
                            "query": "",
                            "key_facts": [prd[:500]],
                        }
                    ],
                    "summary_facts": [prd[:500]],
                    "unknowns": [],
                }

        store.update_steps(run_id, "research", research_dict)
        citations = [
            {"id": source["id"], "title": source.get("title", ""), "url": source.get("url", "")}
            for source in research_dict.get("sources", [])
        ]
        store.set_citations(run_id, citations)
        await _log(run_id, store, "Research re-done with feedback", repo=repo)

    if stage in ["researcher", "writer"]:
        research_json_for_prompt = json.dumps(research_dict, indent=2)
        revision_instructions = ""
        if stage == "writer" and feedback:
            revision_instructions = (
                f"\n\n--- USER FEEDBACK ---\n{feedback}\n\n"
                "Please incorporate this feedback and revise accordingly.\n"
            )

        current_iteration = len(steps.get("drafts", [])) + 1
        await _log(run_id, store, "Re-running Step 2: Writer with feedback", repo=repo)
        write_result = await _run_step(
            run_id=run_id,
            step_name="writer",
            iteration=current_iteration,
            task_key="write_task",
            task_inputs={
                "prd": prd,
                "research_json": research_json_for_prompt,
                "tone": tone,
                "audience": audience,
                "word_count": str(word_count),
                "revision_instructions": revision_instructions,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        draft_text = write_result.text

        store.append_step(run_id, "drafts", {"iteration": current_iteration, "text": draft_text})
        await _log(run_id, store, f"Draft revised based on feedback ({len(draft_text)} chars)", repo=repo)

        await _log(run_id, store, "Re-running Step 3: Fact-checker", repo=repo)
        fact_result = await _run_step(
            run_id=run_id,
            step_name="fact_checker",
            iteration=current_iteration,
            task_key="fact_check_task",
            task_inputs={
                "draft": draft_text,
                "research_json": research_json_for_prompt,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        fc_dict = _normalize_fact_check(extract_json(fact_result.text), default_passed=True)

        store.append_step(
            run_id,
            "fact_checks",
            {
                "iteration": current_iteration,
                "passed": fc_dict.get("passed", True),
                "issues": fc_dict.get("issues", []),
                "rewrite_instructions": fc_dict.get("rewrite_instructions", ""),
            },
        )
        await _log(run_id, store, f"Fact-check re-run: passed={fc_dict.get('passed', True)}", repo=repo)

    if stage == "fact_checker":
        drafts = steps.get("drafts", [])
        if not drafts:
            raise Exception("No draft available to fact-check")

        latest_draft = drafts[-1]["text"]
        research_json_for_prompt = json.dumps(research_dict, indent=2)
        fc_inputs: dict[str, Any] = {
            "draft": latest_draft,
            "research_json": research_json_for_prompt,
        }
        if feedback:
            fc_inputs["additional_instructions"] = (
                f"\n\nUSER FEEDBACK:\n{feedback}\n\n"
                "Please pay special attention to these concerns.\n"
            )

        await _log(run_id, store, "Re-running Step 3: Fact-checker with feedback", repo=repo)
        fact_result = await _run_step(
            run_id=run_id,
            step_name="fact_checker",
            iteration=len(steps.get("fact_checks", [])) + 1,
            task_key="fact_check_task",
            task_inputs=fc_inputs,
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        fc_dict = _normalize_fact_check(extract_json(fact_result.text), default_passed=True)

        current_iteration = len(steps.get("fact_checks", [])) + 1
        store.append_step(
            run_id,
            "fact_checks",
            {
                "iteration": current_iteration,
                "passed": fc_dict.get("passed", True),
                "issues": fc_dict.get("issues", []),
                "rewrite_instructions": fc_dict.get("rewrite_instructions", ""),
            },
        )
        await _log(run_id, store, "Fact-check re-run with feedback", repo=repo)
        draft_text = latest_draft
    else:
        drafts = steps.get("drafts", [])
        draft_text = drafts[-1]["text"] if drafts else ""

    if research_dict is None:
        research_dict = {
            "queries": [],
            "sources": [{"id": "S0", "title": "PRD", "url": "internal://prd", "query": "", "key_facts": [prd[:500]]}],
            "summary_facts": [prd[:500]],
            "unknowns": [],
        }
    research_json_for_prompt = json.dumps(research_dict, indent=2)
    latest_fact_checks = (store.load(run_id) or {}).get("steps", {}).get("fact_checks", [])
    fact_passed = bool(latest_fact_checks[-1].get("passed", True)) if latest_fact_checks else True

    final_md, fact_passed, rubric_result, review_required, rubric_attempts = await _finalize_with_quality_gate(
        run_id=run_id,
        store=store,
        repo=repo,
        crew_instance=crew_instance,
        draft_text=draft_text,
        prd=prd,
        tone=tone,
        audience=audience,
        word_count=word_count,
        research_json_for_prompt=research_json_for_prompt,
        model_provider=model_provider,
        model_name=model_name,
        fact_passed=fact_passed,
    )

    final_status = "DONE" if fact_passed and rubric_result.get("passed") and not review_required else "DONE_WITH_WARNINGS"
    await _set_status(run_id, store, final_status, repo=repo)
    await _log(
        run_id,
        store,
        f"Pipeline re-run complete with user feedback - status={final_status}, rubric_passed={rubric_result.get('passed')}, attempts={rubric_attempts}",
        repo=repo,
    )
    return store.load(run_id) or {}


def _normalize_fact_check(fc_dict: Optional[dict[str, Any]], default_passed: bool = False) -> dict[str, Any]:
    if fc_dict is None:
        return {
            "passed": default_passed,
            "issues": [
                {
                    "claim": "parse error",
                    "reason": "Could not parse fact-check output",
                    "suggested_fix": "Retry",
                    "source_ids": [],
                }
            ]
            if not default_passed
            else [],
            "rewrite_instructions": "Please ensure all claims are properly cited." if not default_passed else "",
        }
    return {
        "passed": bool(fc_dict.get("passed", default_passed)),
        "issues": fc_dict.get("issues", []) if isinstance(fc_dict.get("issues", []), list) else [],
        "rewrite_instructions": str(fc_dict.get("rewrite_instructions", "") or ""),
    }


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _rubric_thresholds() -> dict[str, Any]:
    min_clarity = _clamp_score(_float_env("RUBRIC_MIN_CLARITY", 3.0))
    min_correctness = _clamp_score(_float_env("RUBRIC_MIN_CORRECTNESS", 4.0))
    min_completeness = _clamp_score(_float_env("RUBRIC_MIN_COMPLETENESS", 3.0))
    min_overall = _clamp_score(_float_env("RUBRIC_MIN_OVERALL", 3.5))
    max_retries = max(0, _int_env("RUBRIC_MAX_RETRIES", 1))
    return {
        "min_clarity": min_clarity,
        "min_correctness": min_correctness,
        "min_completeness": min_completeness,
        "min_overall": min_overall,
        "max_retries": max_retries,
        "scale_min": RUBRIC_SCALE_MIN,
        "scale_max": RUBRIC_SCALE_MAX,
    }


def _clamp_score(value: Any) -> float:
    try:
        num = float(value)
    except (TypeError, ValueError):
        num = RUBRIC_SCALE_MIN
    return max(RUBRIC_SCALE_MIN, min(RUBRIC_SCALE_MAX, num))


def _as_string_list(value: Any, default: Optional[list[str]] = None) -> list[str]:
    if default is None:
        default = []
    if not isinstance(value, list):
        return default
    out: list[str] = []
    for item in value:
        if item is None:
            continue
        text = str(item).strip()
        if text:
            out.append(text)
    return out or default


def _normalize_rubric_payload(
    raw: Optional[dict[str, Any]],
    thresholds: dict[str, Any],
    grader_model: str,
) -> dict[str, Any]:
    data = raw or {}
    scores_node = data.get("scores") if isinstance(data.get("scores"), dict) else data

    clarity = _clamp_score(scores_node.get("clarity"))
    correctness = _clamp_score(scores_node.get("correctness"))
    completeness = _clamp_score(scores_node.get("completeness"))

    raw_overall = scores_node.get("overall")
    if raw_overall is None:
        overall = round((clarity + correctness + completeness) / 3, 2)
    else:
        overall = round(_clamp_score(raw_overall), 2)

    passed = (
        clarity >= thresholds["min_clarity"]
        and correctness >= thresholds["min_correctness"]
        and completeness >= thresholds["min_completeness"]
        and overall >= thresholds["min_overall"]
    )

    return {
        "scores": {
            "clarity": round(clarity, 2),
            "correctness": round(correctness, 2),
            "completeness": round(completeness, 2),
            "overall": overall,
            "scale_min": RUBRIC_SCALE_MIN,
            "scale_max": RUBRIC_SCALE_MAX,
        },
        "thresholds": {
            "min_clarity": thresholds["min_clarity"],
            "min_correctness": thresholds["min_correctness"],
            "min_completeness": thresholds["min_completeness"],
            "min_overall": thresholds["min_overall"],
        },
        "passed": passed,
        "strengths": _as_string_list(data.get("strengths")),
        "weaknesses": _as_string_list(data.get("weaknesses")),
        "recommendations": _as_string_list(data.get("recommendations")),
        "grader_model": grader_model,
    }


def _build_rubric_revision_instructions(rubric: dict[str, Any]) -> str:
    scores = rubric.get("scores", {})
    weaknesses = rubric.get("weaknesses", [])
    recommendations = rubric.get("recommendations", [])
    weak_text = "\n".join([f"- {item}" for item in weaknesses]) if weaknesses else "- Improve overall editorial quality."
    rec_text = "\n".join([f"- {item}" for item in recommendations]) if recommendations else "- Tighten structure, factual precision, and completeness."

    return (
        "\n\n--- RUBRIC QUALITY GATE FAILED ---\n"
        f"Scores (1-5): clarity={scores.get('clarity')}, correctness={scores.get('correctness')}, "
        f"completeness={scores.get('completeness')}, overall={scores.get('overall')}\n\n"
        "Weaknesses to address:\n"
        f"{weak_text}\n\n"
        "Revision requirements:\n"
        f"{rec_text}\n\n"
        "Hard constraints:\n"
        "- Keep all claims fully supported by the provided research JSON.\n"
        "- Keep or improve citation coverage using [S#] tags.\n"
        "- Do not add unsupported facts.\n"
        "- Improve clarity, correctness, and completeness to meet rubric thresholds.\n"
    )


def _next_iteration(store: RunStore, run_id: str, step_key: str) -> int:
    state = store.load(run_id) or {}
    steps = state.get("steps", {})
    values = steps.get(step_key, [])
    if isinstance(values, list):
        return len(values) + 1
    return 1


async def _grade_rubric(
    run_id: str,
    prd: str,
    research_json_for_prompt: str,
    final_markdown: str,
    model_provider: str,
    model_name: str,
    attempt: int,
    store: RunStore,
    repo: Optional[RunRepo],
) -> dict[str, Any]:
    thresholds = _rubric_thresholds()
    grader_model = os.getenv("RUBRIC_MODEL") or model_name

    system_prompt = (
        "You are a strict editorial grader. Evaluate quality using rubric scores from 1 to 5. "
        "Focus on: clarity, correctness, completeness. Return ONLY JSON with keys: "
        "clarity, correctness, completeness, overall, strengths, weaknesses, recommendations."
    )
    user_prompt = (
        f"PRD:\n{prd}\n\n"
        f"Research JSON:\n{research_json_for_prompt}\n\n"
        f"Final Markdown:\n{final_markdown}\n\n"
        "Scoring rubric (1=poor, 5=excellent):\n"
        "- clarity: structure, readability, coherence\n"
        "- correctness: factual alignment with provided sources/PRD and citation discipline\n"
        "- completeness: covers core requirements and important points expected from the PRD\n"
    )

    step_id: Optional[int] = None
    if repo is not None:
        try:
            step_id = await repo.step_start(
                run_id,
                "rubric_grader",
                attempt,
                {
                    "model": grader_model,
                    "thresholds": {
                        "min_clarity": thresholds["min_clarity"],
                        "min_correctness": thresholds["min_correctness"],
                        "min_completeness": thresholds["min_completeness"],
                        "min_overall": thresholds["min_overall"],
                    },
                },
            )
        except Exception:
            step_id = None

    try:
        llm_result = await call_llm(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=grader_model,
            temperature=0,
        )
        parsed = extract_json(llm_result.get("text", ""))
        rubric_payload = _normalize_rubric_payload(parsed, thresholds, grader_model)
        rubric_payload["attempt"] = attempt
        rubric_payload["latency_ms"] = int(llm_result.get("latency_ms", 0))
        rubric_payload["usage"] = llm_result.get("usage", {})

        if repo is not None and step_id is not None:
            try:
                await repo.step_end(step_id, "DONE", rubric_payload, rubric_payload["latency_ms"])
            except Exception:
                pass
            usage = rubric_payload.get("usage", {})
            try:
                await repo.log_llm_call(
                    run_id=run_id,
                    step_name="rubric_grader",
                    model_provider=model_provider,
                    model_name=grader_model,
                    prompt_tokens=int(usage.get("prompt_tokens", 0)),
                    completion_tokens=int(usage.get("completion_tokens", 0)),
                    total_tokens=int(usage.get("total_tokens", 0)),
                    latency_ms=rubric_payload["latency_ms"],
                )
            except Exception:
                pass
        return rubric_payload
    except Exception as exc:
        await _log(run_id, store, f"Rubric grader failed: {str(exc)}", repo=repo, level="warning")
        fallback = _normalize_rubric_payload(None, thresholds, grader_model)
        fallback["passed"] = False
        fallback["attempt"] = attempt
        fallback["error"] = str(exc)
        fallback["latency_ms"] = 0
        fallback["usage"] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        if repo is not None and step_id is not None:
            try:
                await repo.step_end(step_id, "ERROR", {"error": str(exc)}, 0)
            except Exception:
                pass
            try:
                await repo.log_llm_call(
                    run_id=run_id,
                    step_name="rubric_grader",
                    model_provider=model_provider,
                    model_name=grader_model,
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0,
                    latency_ms=0,
                    error=str(exc),
                )
            except Exception:
                pass
        return fallback


async def _finalize_with_quality_gate(
    run_id: str,
    store: RunStore,
    repo: Optional[RunRepo],
    crew_instance: PrdBlogCrew,
    draft_text: str,
    prd: str,
    tone: str,
    audience: str,
    word_count: int,
    research_json_for_prompt: str,
    model_provider: str,
    model_name: str,
    fact_passed: bool,
) -> tuple[str, bool, dict[str, Any], bool, int]:
    thresholds = _rubric_thresholds()
    max_rubric_retries = thresholds["max_retries"]
    rubric_attempt = 0
    review_required = False
    final_md = draft_text
    rubric_payload: dict[str, Any] = {
        "scores": {"clarity": 0, "correctness": 0, "completeness": 0, "overall": 0, "scale_min": 1, "scale_max": 5},
        "passed": False,
        "attempt": 0,
    }

    while True:
        rubric_attempt += 1
        await _log(run_id, store, f"Step 4: Style polisher attempt {rubric_attempt}", repo=repo)
        polish_result = await _run_step(
            run_id=run_id,
            step_name="style_editor",
            iteration=rubric_attempt,
            task_key="polish_task",
            task_inputs={
                "draft": draft_text,
                "tone": tone,
                "audience": audience,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        final_md = polish_result.text
        store.update_steps(run_id, "final", {"markdown": final_md})

        await _log(run_id, store, f"Step 5: Rubric grader attempt {rubric_attempt}", repo=repo)
        rubric_payload = await _grade_rubric(
            run_id=run_id,
            prd=prd,
            research_json_for_prompt=research_json_for_prompt,
            final_markdown=final_md,
            model_provider=model_provider,
            model_name=model_name,
            attempt=rubric_attempt,
            store=store,
            repo=repo,
        )
        rubric_payload["review_required"] = False
        rubric_payload["attempts"] = rubric_attempt
        store.update_steps(run_id, "rubric", rubric_payload)
        store.update(
            run_id,
            {
                "quality_gate": {
                    "passed": bool(rubric_payload.get("passed")),
                    "review_required": False,
                    "attempts": rubric_attempt,
                    "scores": rubric_payload.get("scores", {}),
                }
            },
        )

        if rubric_payload.get("passed"):
            break

        if rubric_attempt > max_rubric_retries:
            review_required = True
            rubric_payload["review_required"] = True
            store.update_steps(run_id, "rubric", rubric_payload)
            store.update(
                run_id,
                {
                    "quality_gate": {
                        "passed": False,
                        "review_required": True,
                        "attempts": rubric_attempt,
                        "scores": rubric_payload.get("scores", {}),
                    }
                },
            )
            break

        await _log(
            run_id,
            store,
            (
                f"Rubric below threshold (overall={rubric_payload.get('scores', {}).get('overall')}/5). "
                "Rolling back to Writer with stricter instructions."
            ),
            repo=repo,
            level="warning",
        )

        strict_revision = _build_rubric_revision_instructions(rubric_payload)
        writer_iteration = _next_iteration(store, run_id, "drafts")
        write_result = await _run_step(
            run_id=run_id,
            step_name="writer",
            iteration=writer_iteration,
            task_key="write_task",
            task_inputs={
                "prd": prd,
                "research_json": research_json_for_prompt,
                "tone": tone,
                "audience": audience,
                "word_count": str(word_count),
                "revision_instructions": strict_revision,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        draft_text = write_result.text
        store.append_step(run_id, "drafts", {"iteration": writer_iteration, "text": draft_text})

        fact_result = await _run_step(
            run_id=run_id,
            step_name="fact_checker",
            iteration=writer_iteration,
            task_key="fact_check_task",
            task_inputs={
                "draft": draft_text,
                "research_json": research_json_for_prompt,
            },
            crew_instance=crew_instance,
            store=store,
            repo=repo,
            model_provider=model_provider,
            model_name=model_name,
        )
        fc_dict = _normalize_fact_check(extract_json(fact_result.text))
        store.append_step(
            run_id,
            "fact_checks",
            {
                "iteration": writer_iteration,
                "passed": fc_dict["passed"],
                "issues": fc_dict["issues"],
                "rewrite_instructions": fc_dict["rewrite_instructions"],
            },
        )
        # The latest rollback draft should define factual gate status.
        fact_passed = bool(fc_dict["passed"])
        await _log(
            run_id,
            store,
            f"Rubric rollback fact-check: passed={fc_dict['passed']}, issues={len(fc_dict['issues'])}",
            repo=repo,
            level="warning" if not fc_dict["passed"] else "info",
        )

    if repo is not None:
        try:
            scores = rubric_payload.get("scores", {})
            await repo.save_rubric(
                run_id=run_id,
                clarity_score=float(scores.get("clarity", 0)),
                correctness_score=float(scores.get("correctness", 0)),
                completeness_score=float(scores.get("completeness", 0)),
                overall_score=float(scores.get("overall", 0)),
                passed=bool(rubric_payload.get("passed", False)),
                review_required=review_required,
                attempts=rubric_attempt,
                thresholds={
                    "min_clarity": thresholds["min_clarity"],
                    "min_correctness": thresholds["min_correctness"],
                    "min_completeness": thresholds["min_completeness"],
                    "min_overall": thresholds["min_overall"],
                    "scale_min": RUBRIC_SCALE_MIN,
                    "scale_max": RUBRIC_SCALE_MAX,
                },
                summary={
                    "strengths": rubric_payload.get("strengths", []),
                    "weaknesses": rubric_payload.get("weaknesses", []),
                    "recommendations": rubric_payload.get("recommendations", []),
                    "grader_model": rubric_payload.get("grader_model"),
                    "attempt": rubric_payload.get("attempt"),
                    "latency_ms": rubric_payload.get("latency_ms", 0),
                },
            )
        except Exception as exc:
            await _log(run_id, store, f"DB save_rubric failed: {str(exc)}", repo=repo, level="warning")

    return final_md, fact_passed, rubric_payload, review_required, rubric_attempt


async def _run_step(
    run_id: str,
    step_name: str,
    iteration: int,
    task_key: str,
    task_inputs: dict[str, Any],
    crew_instance: PrdBlogCrew,
    store: RunStore,
    repo: Optional[RunRepo],
    model_provider: str,
    model_name: str,
) -> KickoffResult:
    step_id: Optional[int] = None

    if repo is not None:
        try:
            step_id = await repo.step_start(run_id, step_name, iteration, task_inputs)
        except Exception:
            step_id = None

    try:
        result = await _kickoff(crew_instance, task_key, task_inputs, store, run_id, repo=repo)
        if repo is not None and step_id is not None:
            try:
                await repo.step_end(
                    step_id,
                    "DONE",
                    {
                        "preview": result.text[:1000],
                    },
                    result.latency_ms,
                )
            except Exception:
                pass
            try:
                await repo.log_llm_call(
                    run_id=run_id,
                    step_name=step_name,
                    model_provider=model_provider,
                    model_name=model_name,
                    prompt_tokens=result.prompt_tokens,
                    completion_tokens=result.completion_tokens,
                    total_tokens=result.total_tokens,
                    latency_ms=result.latency_ms,
                )
            except Exception:
                pass
        return result
    except Exception as exc:
        if repo is not None and step_id is not None:
            try:
                await repo.step_end(
                    step_id,
                    "ERROR",
                    {"error": str(exc)},
                    0,
                )
            except Exception:
                pass
            try:
                await repo.log_llm_call(
                    run_id=run_id,
                    step_name=step_name,
                    model_provider=model_provider,
                    model_name=model_name,
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0,
                    latency_ms=0,
                    error=str(exc),
                )
            except Exception:
                pass
        raise


async def _kickoff(
    crew_instance: PrdBlogCrew,
    task_key: str,
    inputs: dict[str, Any],
    store: RunStore,
    run_id: str,
    repo: Optional[RunRepo] = None,
) -> KickoffResult:
    """Run one CrewAI task in a thread pool and return text + usage metrics."""
    loop = asyncio.get_running_loop()
    start = time.perf_counter()
    try:
        result = await loop.run_in_executor(None, crew_instance.kickoff_step, task_key, inputs, 0)
    except Exception as exc:
        error_str = str(exc).lower()
        if "rate_limit" in error_str or "rate limit" in error_str:
            await _log(run_id, store, f"Rate limit hit in {task_key} - fallback chain exhausted", repo=repo, level="warning")
        await _log(run_id, store, f"ERROR in {task_key}: {traceback.format_exc()}", repo=repo, level="error")
        raise

    latency_ms = int((time.perf_counter() - start) * 1000)
    text = _extract_text(result)
    prompt_tokens, completion_tokens, total_tokens = _extract_usage(result)

    return KickoffResult(
        text=text,
        latency_ms=latency_ms,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )


def _extract_text(result: Any) -> str:
    if isinstance(result, str):
        return result
    raw = getattr(result, "raw", None)
    if isinstance(raw, str) and raw:
        return raw
    return str(result)


def _extract_usage(result: Any) -> tuple[int, int, int]:
    token_usage = getattr(result, "token_usage", None)
    if token_usage is None:
        return 0, 0, 0

    prompt_tokens = int(getattr(token_usage, "prompt_tokens", 0) or 0)
    completion_tokens = int(getattr(token_usage, "completion_tokens", 0) or 0)
    total_tokens = int(getattr(token_usage, "total_tokens", 0) or 0)
    return prompt_tokens, completion_tokens, total_tokens


async def _log(
    run_id: str,
    store: RunStore,
    message: str,
    repo: Optional[RunRepo] = None,
    level: str = "info",
) -> None:
    store.log(run_id, message)
    if repo is None:
        return
    try:
        await repo.log(run_id, message, level=level)
    except Exception:
        return


async def _set_status(
    run_id: str,
    store: RunStore,
    status: str,
    repo: Optional[RunRepo] = None,
    error: Optional[str] = None,
) -> None:
    store.set_status(run_id, status, error=error)
    if repo is None:
        return
    try:
        await repo.set_status(run_id, status, error=error)
    except Exception:
        return
