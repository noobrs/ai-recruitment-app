# api/image/pipeline.py
import cv2
import numpy as np
import tempfile
import os
from .preprocessing import remove_drawing_lines, remove_bullets_symbols
from .detection_model import detect_segments
from .ocr_extraction import extract_text_from_segments, extract_text_simple
from .text_classification import classify_segments
from .ner_extraction import extract_resume_entities
from .builder import build_resume_json_v2

def process_image_resume(file_bytes: bytes):
    """End-to-end pipeline for image-based resume extraction.
       Returns resume JSON."""
    # decode bytes -> image
    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image bytes")

    # write to temp files
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_in:
        in_path = tmp_in.name
        cv2.imwrite(in_path, img)

    cleaned_path = in_path + "_cleaned.jpg"
    # remove lines into cleaned_path
    remove_drawing_lines(img, cleaned_path)
    # remove bullets in-place
    remove_bullets_symbols(cleaned_path)

    # detection
    boxes = detect_segments(cleaned_path)
    if not boxes:
        # fallback: run OCR on whole
        ocr_results = extract_text_simple(cleaned_path)
        # return minimal
        # cleanup temp files
        try:
            os.remove(in_path)
            os.remove(cleaned_path)
        except Exception:
            pass
        return {"status": "warning", "message": "no boxes detected", "ocr": ocr_results}

    # ocr, classify, ner, build json
    ocr_results = extract_text_from_segments(cleaned_path, boxes)
    classified_segments = classify_segments(ocr_results)
    hybrid_results = extract_resume_entities(classified_segments)
    resume_json = build_resume_json_v2(classified_segments, hybrid_results)

    # cleanup temp files
    try:
        os.remove(in_path)
        os.remove(cleaned_path)
    except Exception:
        pass

    return {"status": "success", "data": resume_json}
