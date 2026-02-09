"""JSON extraction and validation guardrails for agent outputs."""
from __future__ import annotations

import json
import re
from typing import Any, Optional


def extract_json(text: str) -> Optional[dict]:
    """Best-effort JSON extraction from LLM output.

    Tries in order:
    1. Direct json.loads on the whole text
    2. Regex for ```json ... ``` blocks
    3. First { … } block
    """
    if not text or not text.strip():
        return None

    # 1) Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # 2) Try code-fenced JSON
    m = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 3) Try first { … } block (greedy)
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    return None


def validate_research(data: Optional[dict]) -> bool:
    """Check that research output has minimum required structure."""
    if data is None:
        return False
    if not isinstance(data.get("sources"), list):
        return False
    if len(data["sources"]) == 0:
        return False
    for s in data["sources"]:
        if "id" not in s:
            return False
    return True


def validate_fact_check(data: Optional[dict]) -> bool:
    """Check that fact-check output has required structure."""
    if data is None:
        return False
    if "passed" not in data:
        return False
    if not isinstance(data.get("issues"), list):
        return False
    return True


def source_ids_in_draft(draft: str, sources: list[dict]) -> dict:
    """Check which source IDs from research are referenced in the draft."""
    all_ids = {s["id"] for s in sources}
    cited = set(re.findall(r"\[S\d+\]", draft))
    cited_ids = {c.strip("[]") for c in cited}
    return {
        "referenced": sorted(cited_ids & all_ids),
        "unreferenced_sources": sorted(all_ids - cited_ids),
        "unknown_citations": sorted(cited_ids - all_ids),
    }
