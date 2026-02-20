from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_user_id
from app.db import is_db_ready
from app.services.run_repo import RunRepo

router = APIRouter(prefix="/metrics", tags=["metrics"])
repo = RunRepo()


@router.get("/summary")
async def metrics_summary(user_id: str | None = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not is_db_ready():
        raise HTTPException(status_code=503, detail="Database is not initialized")
    return await repo.metrics_summary(user_id=user_id)


@router.get("/runs")
async def metrics_runs(
    limit: int = Query(default=50, ge=1, le=500),
    user_id: str | None = Depends(get_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not is_db_ready():
        raise HTTPException(status_code=503, detail="Database is not initialized")
    return await repo.metrics_runs(limit=limit, user_id=user_id)
