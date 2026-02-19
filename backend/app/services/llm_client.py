"""Thin LiteLLM client helper for explicit model calls."""
from __future__ import annotations

import time
from typing import Any

from litellm import acompletion


async def call_llm(messages: list[dict[str, Any]], model: str, **kwargs: Any) -> dict[str, Any]:
    start = time.perf_counter()
    resp = await acompletion(model=model, messages=messages, **kwargs)
    latency_ms = int((time.perf_counter() - start) * 1000)

    usage = (resp.get("usage") or {}) if isinstance(resp, dict) else (getattr(resp, "usage", {}) or {})

    content = ""
    if isinstance(resp, dict):
        content = resp.get("choices", [{}])[0].get("message", {}).get("content", "")
    else:
        choices = getattr(resp, "choices", []) or []
        if choices:
            message = getattr(choices[0], "message", None)
            content = getattr(message, "content", "") if message is not None else ""

    return {
        "text": content,
        "usage": {
            "prompt_tokens": int(usage.get("prompt_tokens", 0)),
            "completion_tokens": int(usage.get("completion_tokens", 0)),
            "total_tokens": int(usage.get("total_tokens", 0)),
        },
        "latency_ms": latency_ms,
        "raw": resp,
    }
