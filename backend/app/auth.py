"""Authentication helpers for Supabase JWT bearer tokens."""
from __future__ import annotations

import json
import os
import time
from urllib.request import urlopen
from typing import Optional

from fastapi import Header, HTTPException
from jose import JWTError, jwt

_JWKS_CACHE: dict | None = None
_JWKS_CACHE_EXP: float = 0.0


def _decode_hs256(token: str, secret: str) -> dict:
    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def _get_jwks() -> dict:
    global _JWKS_CACHE, _JWKS_CACHE_EXP
    now = time.time()
    if _JWKS_CACHE is not None and now < _JWKS_CACHE_EXP:
        return _JWKS_CACHE

    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise RuntimeError("SUPABASE_URL is not configured")

    jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    with urlopen(jwks_url, timeout=5) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    _JWKS_CACHE = data
    _JWKS_CACHE_EXP = now + 600  # 10 minutes
    return data


def _decode_with_jwks(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    alg = header.get("alg")
    if not kid:
        raise JWTError("Token is missing kid header")

    jwks = _get_jwks()
    keys = jwks.get("keys", [])
    key = next((k for k in keys if k.get("kid") == kid), None)
    if key is None:
        raise JWTError("No matching JWKS key found for token kid")

    algorithms = [alg] if alg else ["RS256", "ES256", "EdDSA"]
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        options={"verify_aud": False},
    )


def get_user_id(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> Optional[str]:
    """Extract the authenticated Supabase user id from Authorization header.

    Returns None when no Authorization header is provided.
    Raises 401 for malformed/invalid bearer tokens.
    """
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    secret = os.getenv("SUPABASE_JWT_SECRET")
    payload: dict | None = None
    try:
        if secret:
            payload = _decode_hs256(token, secret)
    except Exception:
        payload = None

    if payload is None:
        try:
            payload = _decode_with_jwks(token)
        except Exception as exc:
            raise HTTPException(status_code=401, detail="Invalid Supabase token") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=401, detail="Invalid Supabase token payload")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid Supabase token payload")
    return str(user_id)
