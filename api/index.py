from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware

import logging

from api.types.types import ApiResponse
from .supabase_client import supabase

# import pipeline stage functions
import tempfile, json, os, shutil
from api.image.ocr_extraction import extract_text_simple    # test
from api.image.detection_model import detect_segments
from api.image.ocr_extraction import extract_text_simple, extract_text_from_segments
from api.image.preprocessing import remove_drawing_lines, remove_bullets_symbols
from api.image.text_classification import classify_segments
from api.image.ner_extraction import extract_resume_entities
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

def _save_upload_to_temp(upload: UploadFile):
    """Save UploadFile to a temp file and return path."""
    suffix = os.path.splitext(upload.filename)[1] or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(upload.file, tmp)
        tmp.close()
        return tmp.name
    finally:
        upload.file.close()


@app.post("/api/py/segments")
async def api_detect_segments(file: UploadFile = File(...)):
    """Detect layout boxes and return list of boxes."""
    tmp_path = _save_upload_to_temp(file)
    try:
        boxes = detect_segments(tmp_path)
        return {"boxes": boxes}
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.post("/api/py/preprocess")
async def api_preprocess(file: UploadFile = File(...)):
    """Run line removal and bullet removal, return path to cleaned image (temp)."""
    tmp_path = _save_upload_to_temp(file)
    cleaned_path = tmp_path + "_cleaned.jpg"
    try:
        # read image and run remove_drawing_lines (we need the image array)
        import cv2
        img = cv2.imread(tmp_path)
        remove_drawing_lines(img, cleaned_path)
        remove_bullets_symbols(cleaned_path)
        # return minimal info; consumer can call /api/py/ocr with the original file again
        return {"cleaned_path": cleaned_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.post("/api/py/ocr")
async def api_ocr(file: UploadFile = File(None), boxes: str = None):
    """
    If boxes is provided (JSON string), runs OCR on boxes; otherwise OCR on whole file.
    boxes example: '[ [x1,y1,x2,y2], ... ]'
    """
    if file is None:
        raise HTTPException(status_code=400, detail="file is required")

    tmp_path = _save_upload_to_temp(file)
    try:
        if boxes:
            try:
                boxes_list = json.loads(boxes)
            except Exception:
                raise HTTPException(status_code=400, detail="invalid boxes JSON")
            ocr = extract_text_from_segments(tmp_path, boxes_list)
            return {"ocr_results": ocr}
        else:
            res = extract_text_simple(tmp_path)
            return {"ocr_results": res}
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.post("/api/py/classify")
async def api_classify(ocr_results: list = Body(...)):
    """
    Accepts OCR results (list of {segment_id, text, box}) and returns classified segments.
    If you prefer, you can call /api/py/ocr then pass returned ocr_results here.
    """
    try:
        classified = classify_segments(ocr_results)
        return {"classified_segments": classified}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/py/entities")
async def api_entities(classified_segments: list = Body(...)):
    """Accepts classified segments and returns NER + normalized entities."""
    try:
        hybrid_results = extract_resume_entities(classified_segments)
        return {"hybrid_results": hybrid_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
