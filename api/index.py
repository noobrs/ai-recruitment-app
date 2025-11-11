from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import logging
from .supabase_client import supabase
from .app.schemas import ProcessResumeRequest
from .app.security import verify_signature
# from .services.resume_pipeline import resume_pipeline, process_pdf_resume, process_image_resume_pipeline

import tempfile
import shutil
from api.image.ocr_extraction import extract_text_simple

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
    
# @app.post("/api/py/extract/image")
# async def extract_image(file: UploadFile = File(...)):
#     contents = await file.read()
#     result = process_image_resume_pipeline(contents)
#     return result

@app.post("/api/py/ocr-test")
async def ocr_test(file: UploadFile = File(...)):
    """Test OCR extraction on uploaded image."""
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    # Run OCR
    result = extract_text_simple(temp_path)
    return {"filename": file.filename, "ocr_result": result}