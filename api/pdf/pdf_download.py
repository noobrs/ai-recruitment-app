from __future__ import annotations
import os, tempfile
from pathlib import Path
import httpx

async def fetch_pdf_to_tmp(pdf_url: str) -> Path:
    """
    Downloads a PDF (e.g., Supabase signed URL) to a temp file and returns the path.
    """
    if not pdf_url.lower().startswith(("http://", "https://")):
        raise ValueError("pdf_url must be http(s)")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(pdf_url)
        resp.raise_for_status()
        fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
        with os.fdopen(fd, "wb") as f:
            f.write(resp.content)
    return Path(tmp_path)
