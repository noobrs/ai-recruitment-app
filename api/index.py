from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import logging

from api.types.types import ApiResponse
from .supabase_client import supabase

# import image pipeline stage functions
import tempfile, os
from api.image.pipeline import process_image_resume

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume Processing API", version="1.0", docs_url="/api/py/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update later for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# ✅ YOUR LOCAL TEST ROUTE
# ==============================
@app.get("/")
def root():
    return {"status": "✅ FastAPI backend running locally"}

# ==============================
# 🩺 HEALTH CHECK
# ==============================
@app.get("/api/py/health")
def health():
    return {"ok": True, "service": "fastapi"}

# ==============================
# 🧠 SUPABASE TEST
# ==============================
@app.get("/api/py/test-supabase")
async def test_supabase():
    try:
        response = supabase.table('users').select("*").limit(1).execute()
        return {
            "status": "connected",
            "message": "Supabase connection successful",
            "data": response.data
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "hint": "Ensure Supabase table exists"
        }

# @app.post("/api/py/process-resume")
# async def process_resume(request: Request, payload: ProcessResumeRequest):
#     import traceback
    
#     logger.info(f"Received process-resume request for resume_id={payload.resume_id}")
    
#     body = await request.body()
#     timestamp = request.headers.get("x-resume-timestamp")
#     signature = request.headers.get("x-resume-signature")

#     if not verify_signature(body, timestamp, signature):
#         logger.warning(f"Invalid signature for resume_id={payload.resume_id}")
#         raise HTTPException(status_code=401, detail="Invalid signature")

#     try:
#         result = await resume_pipeline.process(payload)
#         logger.info(f"Successfully processed resume_id={payload.resume_id}")
#     except Exception as exc:
#         # Log the full traceback for debugging
#         logger.error(f"ERROR: Resume processing failed for resume_id={payload.resume_id}")
#         logger.error(f"Exception type: {type(exc).__name__}")
#         logger.error(f"Exception message: {str(exc)}")
#         logger.error(f"Full traceback:\n{traceback.format_exc()}")
#         raise HTTPException(status_code=500, detail=f"Resume processing failed: {exc}") from exc

#     return {
#         "status": "processed",
#         "resume_id": result.resume_id,
#         "job_seeker_id": result.job_seeker_id,
#         "redacted_file_path": result.redacted_file_path,
#     }

# route automatically in FastAPI:
# @app.post("/api/py/process-resume")
# async def process_resume(file: UploadFile = File(...)):
#     filename = file.filename.lower()
#     contents = await file.read()

#     if filename.endswith((".jpg", ".jpeg", ".png")):
#         return process_image_resume(contents)
#     elif filename.endswith(".pdf"):
#         return process_pdf_resume(contents)
#     else:
#         raise HTTPException(status_code=400, detail="Unsupported file type")

# @app.post("/api/py/extract/image")
# async def extract_image(file: UploadFile = File(...)):
#     contents = await file.read()
#     result = process_image_resume_pipeline(contents)
#     return result

# ----------------------
# Image Part
# ----------------------

@app.post("/api/py/process-image")
async def api_process_image(file: UploadFile = File(...)):
    """
    Full unified pipeline.
    Save uploaded file to a temp path first, because underlying
    image functions require a real file path (not bytes).
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    try:
        tmp_bytes = await file.read()
        result = process_image_resume(tmp_bytes)

        return result

    except Exception as e:
        logger.error(f"Image processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------
# PDF Part
# ----------------------

@app.post("/api/py/process-pdf")
async def api_process_pdf(file: UploadFile = File(...)) -> ApiResponse:
    """Full end-to-end pipeline for PDF: layout -> grouping -> GLiNER -> aggregate -> build json.
    Accepts a file upload via multipart form data.
    This endpoint only extracts data and does NOT save to database."""
    from api.pdf.pipeline import process_pdf_resume
    
    if not file:
        raise HTTPException(status_code=400, detail="File is required")
    
    try:
        tmp_bytes = await file.read()
        result = process_pdf_resume(tmp_bytes)
        logger.info(f"PDF processing result: {result}")
        return result
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))