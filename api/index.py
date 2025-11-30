from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware

import logging

from api.types.types import ApiResponse
from .supabase_client import supabase

# import pipeline stage functions
from api.image.pipeline import process_image_resume

from api.services.ranking_service import rank_application

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

# ----------------------
# Image Part
# ----------------------

@app.post("/api/py/process-image")
async def api_process_image(file: UploadFile = File(...)):
    """Full end-to-end pipeline: detect -> ocr -> classify -> ner -> build json.
    Accepts a file upload via multipart form data.
    This endpoint only extracts data and does NOT save to database."""
    
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


# ----------------------
# Candidate Ranking API
# ----------------------

@app.post("/api/py/rank/application/{application_id}")
async def api_rank_application(application_id: int):
    try:
        result = await rank_application(application_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
