from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import logging

from api.types.types import ApiResponse
from .supabase_client import supabase

# IMPORTANT: import the NEW pipeline, not the old one
from api.image.pipeline import process_image_resume

from api.services.ranking_service import rank_application

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("api.index")

app = FastAPI(
    title="AI Resume Processing API",
    version="1.0",
    docs_url="/api/py/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "✅ FastAPI backend running locally"}

@app.get("/api/py/health")
def health():
    return {"ok": True, "service": "fastapi"}

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
            "message": str(e)
        }

# ----------------------
# IMAGE PIPELINE
# ----------------------
@app.post("/api/py/process-image")
async def api_process_image(file: UploadFile = File(...)) -> ApiResponse:
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    try:
        tmp_bytes = await file.read()
        logger.info(f"[IMAGE] Received file: {file.filename}")

        result = process_image_resume(tmp_bytes)

        logger.info("[IMAGE] Pipeline completed successfully")
        return result

    except Exception as e:
        logger.error(f"[IMAGE] Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# PDF PIPELINE
# ----------------------
@app.post("/api/py/process-pdf")
async def api_process_pdf(file: UploadFile = File(...)) -> ApiResponse:
    from api.pdf.pipeline import process_pdf_resume
    
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    try:
        tmp_bytes = await file.read()
        logger.info(f"[PDF] Received file: {file.filename}")

        result = process_pdf_resume(tmp_bytes)

        logger.info("[PDF] Pipeline completed successfully")
        return result

    except Exception as e:
        logger.error(f"[PDF] Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# RANKING
# ----------------------
@app.post("/api/py/rank/application/{application_id}")
async def api_rank_application(application_id: int):
    try:
        return await rank_application(application_id)
    except Exception as e:
        logger.error(f"[RANK] Error ranking application {application_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
