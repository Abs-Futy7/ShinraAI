"""Pydantic schemas for structured agent outputs."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Research ──────────────────────────────────────────────────────────────────

class ResearchSource(BaseModel):
    id: str = Field(..., description="Source ID like S1, S2")
    title: str = Field(..., description="Source title")
    url: str = Field(..., description='URL or "internal://prd"')
    query: str = Field(default="", description="Query that found this source")
    key_facts: List[str] = Field(default_factory=list, description="Key facts from this source")


class ResearchOutput(BaseModel):
    queries: List[str] = Field(default_factory=list, description="Search queries used")
    sources: List[ResearchSource] = Field(default_factory=list)
    summary_facts: List[str] = Field(default_factory=list, description="Consolidated facts")
    unknowns: List[str] = Field(default_factory=list, description="Items that could not be verified")


# ── Fact-Check ────────────────────────────────────────────────────────────────

class FactIssue(BaseModel):
    claim: str
    reason: str
    suggested_fix: str
    source_ids: List[str] = Field(default_factory=list)


class FactCheckOutput(BaseModel):
    passed: bool
    issues: List[FactIssue] = Field(default_factory=list)
    rewrite_instructions: str = Field(default="", description="Instructions for the writer to fix issues")


# ── Run persistence ──────────────────────────────────────────────────────────

class DraftIteration(BaseModel):
    iteration: int
    text: str


class FactCheckIteration(BaseModel):
    iteration: int
    passed: bool
    issues: List[FactIssue] = Field(default_factory=list)
    rewrite_instructions: str = ""


class Citation(BaseModel):
    id: str
    title: str
    url: str


class RunSteps(BaseModel):
    research: Optional[dict] = None
    drafts: List[DraftIteration] = Field(default_factory=list)
    fact_checks: List[FactCheckIteration] = Field(default_factory=list)
    final: Optional[dict] = None


class RunState(BaseModel):
    run_id: str
    inputs: dict
    steps: RunSteps = Field(default_factory=RunSteps)
    citations: List[Citation] = Field(default_factory=list)
    status: str = "PENDING"
    error: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
