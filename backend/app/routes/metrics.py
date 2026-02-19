from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.db import is_db_ready
from app.services.run_repo import RunRepo

router = APIRouter(prefix="/metrics", tags=["metrics"])
repo = RunRepo()


@router.get("/summary")
async def metrics_summary():
    if not is_db_ready():
        raise HTTPException(status_code=503, detail="Database is not initialized")
    return await repo.metrics_summary()


@router.get("/runs")
async def metrics_runs(limit: int = Query(default=50, ge=1, le=500)):
    if not is_db_ready():
        raise HTTPException(status_code=503, detail="Database is not initialized")
    return await repo.metrics_runs(limit=limit)
