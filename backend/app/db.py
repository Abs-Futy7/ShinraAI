"""Database pool lifecycle for async PostgreSQL access."""
from __future__ import annotations

import os
from typing import Optional

import asyncpg

_pool: Optional[asyncpg.Pool] = None


async def init_db() -> bool:
    """Initialize a shared asyncpg pool if DATABASE_URL is set."""
    global _pool
    if _pool is not None:
        return True

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        return False

    try:
        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=1,
            max_size=5,
        )
    except Exception:
        _pool = None
        return False

    return True


async def close_db() -> None:
    """Close the shared asyncpg pool if initialized."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def is_db_ready() -> bool:
    return _pool is not None


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB not initialized. Call init_db() on startup.")
    return _pool
