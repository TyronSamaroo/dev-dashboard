"""API-key authentication for write endpoints."""

import os
from fastapi import Header, HTTPException

_API_KEY = os.environ.get("ADMIN_API_KEY", "")


def require_api_key(x_api_key: str = Header(default="")) -> None:
    """FastAPI dependency — call via Depends(require_api_key)."""
    if not _API_KEY:
        # No key configured → allow everything (local dev convenience)
        return
    if x_api_key != _API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
