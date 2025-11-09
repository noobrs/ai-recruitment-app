from __future__ import annotations
import asyncio, io, logging
from datetime import datetime, timezone
from typing import List
import httpx
from PIL import Image

from ..app.schemas import ProcessResumeRequest, ProcessedResumeWebhook, ResumeProcessingResult
from ..app.security import generate_signature
from ..config import settings
from ..supabase_client import supabase

# ✅ import your image pipeline
from ..image.pipeline import process_image_resume

logger = logging.getLogger(__name__)

RESUMES_REDACTED_BUCKET = "resumes-redacted"
SENSITIVE_KEYWORDS = ["male", "female", "gender", "race", "ethnicity", "religion"]


class ResumePipelineService:
    def __init__(self) -> None:
        self._http = httpx.AsyncClient(timeout=httpx.Timeout(60.0))

    async def aclose(self):
        await self._http.aclose()

    async def process(self, payload: ProcessResumeRequest) -> ResumeProcessingResult:
        try:
            logger.info(f"Processing resume_id={payload.resume_id}, mime={payload.mime_type}")

            # download
            original_bytes = await self._download_file(payload.download_url)

            # 🧠 choose flow by MIME
            if payload.mime_type.startswith("image/"):
                logger.info("Detected image-based resume. Running image OCR pipeline...")
                image_result = process_image_resume(original_bytes)
                resume_json = image_result.get("data", {})
                redacted_path = "local_image_processed.json"  # no upload yet
            else:
                logger.info("Detected PDF resume. Running PDF NLP pipeline...")
                pdf_bytes = await self._ensure_pdf_bytes(payload.mime_type, original_bytes)
                redacted_path = await self._upload_redacted(payload.resume_id, payload.job_seeker_id, pdf_bytes)
                resume_json = {"skills": [], "education": [], "experience": []}

            result = ResumeProcessingResult(
                resume_id=payload.resume_id,
                job_seeker_id=payload.job_seeker_id,
                redacted_file_path=redacted_path,
                skills=resume_json.get("skills", []),
                education=resume_json.get("education", []),
                experience=resume_json.get("experience", []),
                feedback=None,
            )

            await self._notify_next(result)
            return result

        except Exception as exc:
            logger.exception(f"Error processing resume_id={payload.resume_id}: {exc}")
            raise

    async def _download_file(self, url: str) -> bytes:
        r = await self._http.get(str(url))
        r.raise_for_status()
        return r.content

    async def _ensure_pdf_bytes(self, mime_type: str, payload: bytes) -> bytes:
        if mime_type == "application/pdf":
            return payload
        def convert():
            with Image.open(io.BytesIO(payload)) as im:
                buf = io.BytesIO()
                im.convert("RGB").save(buf, format="PDF")
                return buf.getvalue()
        return await asyncio.to_thread(convert)

    async def _upload_redacted(self, resume_id: int, job_seeker_id: int, pdf_bytes: bytes) -> str:
        key = f"{job_seeker_id}/{resume_id}.pdf"
        path = f"{RESUMES_REDACTED_BUCKET}/{key}"
        supabase.storage.from_(RESUMES_REDACTED_BUCKET).upload(
            key, pdf_bytes, {"content-type": "application/pdf", "x-upsert": "true"},
        )
        return path

    async def _notify_next(self, result: ResumeProcessingResult):
        payload = ProcessedResumeWebhook(
            resume_id=result.resume_id,
            job_seeker_id=result.job_seeker_id,
            redacted_file_path=result.redacted_file_path,
            extracted_skills=result.skills,
            extracted_education=result.education,
            extracted_experiences=result.experience,
            feedback=result.feedback,
        )
        body = payload.model_dump_json().encode("utf-8")
        ts = datetime.now(timezone.utc).isoformat()
        sig = generate_signature(body, ts)
        await self._http.post(
            str(settings.next_webhook_url),
            content=body,
            headers={"Content-Type": "application/json", "x-resume-timestamp": ts, "x-resume-signature": sig},
            timeout=httpx.Timeout(30.0),
        )

resume_pipeline = ResumePipelineService()
