"""Local JSON persistence for run state."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class RunStore:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    def _run_dir(self, run_id: str) -> Path:
        d = self.base_dir / run_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _state_path(self, run_id: str) -> Path:
        return self._run_dir(run_id) / "state.json"

    def _log_path(self, run_id: str) -> Path:
        return self._run_dir(run_id) / "logs.txt"

    # ── init ──────────────────────────────────────────────────────────────

    def init_run(self, run_id: str, inputs: dict) -> dict:
        state = {
            "run_id": run_id,
            "inputs": inputs,
            "steps": {
                "research": None,
                "drafts": [],
                "fact_checks": [],
                "final": None,
                "rubric": None,
            },
            "citations": [],
            "feedback": [],  # Track user feedback for each stage
            "quality_gate": None,
            "status": "PENDING",
            "error": None,
            "logs": [],
        }
        self._save(run_id, state)
        self.log(run_id, "Run initialised")
        return state

    # ── load / save ───────────────────────────────────────────────────────

    def load(self, run_id: str) -> Optional[dict]:
        p = self._state_path(run_id)
        if not p.exists():
            return None
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, run_id: str, state: dict):
        with open(self._state_path(run_id), "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, default=str)

    # ── mutations ─────────────────────────────────────────────────────────

    def update(self, run_id: str, patch: Dict[str, Any]):
        state = self.load(run_id) or {}
        state.update(patch)
        self._save(run_id, state)

    def update_steps(self, run_id: str, key: str, value: Any):
        state = self.load(run_id) or {}
        state["steps"][key] = value
        self._save(run_id, state)

    def append_step(self, run_id: str, key: str, value: Any):
        state = self.load(run_id) or {}
        if not isinstance(state["steps"].get(key), list):
            state["steps"][key] = []
        state["steps"][key].append(value)
        self._save(run_id, state)

    def set_status(self, run_id: str, status: str, error: str | None = None):
        state = self.load(run_id) or {}
        state["status"] = status
        if error:
            state["error"] = error
        self._save(run_id, state)

    def set_citations(self, run_id: str, citations: list):
        state = self.load(run_id) or {}
        state["citations"] = citations
        self._save(run_id, state)

    def add_feedback(self, run_id: str, stage: str, feedback: str):
        """Add user feedback for a specific stage."""
        state = self.load(run_id) or {}
        if "feedback" not in state:
            state["feedback"] = []
        
        feedback_entry = {
            "stage": stage,
            "feedback": feedback,
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds")
        }
        state["feedback"].append(feedback_entry)
        self._save(run_id, state)
        self.log(run_id, f"📝 User feedback added for stage: {stage}")

    def update_linkedin_pack(self, run_id: str, component: str, data: dict):
        """Store LinkedIn pack generation results."""
        state = self.load(run_id) or {}
        if "linkedin_pack" not in state:
            state["linkedin_pack"] = {}
        
        state["linkedin_pack"][component] = data
        self._save(run_id, state)
        self.log(run_id, f"💼 LinkedIn pack updated: {component}")

    # ── logging ───────────────────────────────────────────────────────────

    def log(self, run_id: str, message: str):
        ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
        line = f"[{ts}] {message}"
        # append to file
        with open(self._log_path(run_id), "a", encoding="utf-8") as f:
            f.write(line + "\n")
        # also save in state for API consumption
        state = self.load(run_id) or {}
        logs = state.get("logs", [])
        logs.append(line)
        state["logs"] = logs
        self._save(run_id, state)
