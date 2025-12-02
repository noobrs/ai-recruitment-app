"""
- process_image_resume(bytes) : the top-level function your FastAPI endpoint calls.
Flow (reordered):
1. save bytes to temp file
2. detect layout boxes (roboflow) on raw image
3. for each box: crop -> preprocess (icons/bullets + lines) -> OCR
4. classify segments
5. NER extraction + normalization
6. return final JSON (builder)
"""

import tempfile
import os
import shutil
import json
import logging
from typing import List

from .detection_model import detect_segments
from .ocr_extraction import extract_text_from_segments, extract_text_simple
from .preprocessing import remove_bullets_symbols, remove_drawing_lines
from .text_classification import classify_segments
from .ner_pipeline import run_full_resume_pipeline
from .builder import build_final_response

logger = logging.getLogger(__name__)

def _write_bytes_to_tempfile(bts: bytes, suffix=".jpg"):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(bts)
    tmp.close()
    return tmp.name

def process_image_resume(image_bytes: bytes,
                         do_preprocess_crops: bool = True,
                         debug: bool = False):
    """
    End-to-end runner. Accepts image bytes and returns final JSON.
    Detection runs on the raw image bytes; each detected crop is preprocessed before OCR.
    """
    tmp_path = _write_bytes_to_tempfile(image_bytes, suffix=".jpg")
    cleaned_crop_tempfiles: List[str] = []
    try:
        # 1) Detect segments via Roboflow on raw image
        boxes = detect_segments(tmp_path)
        logger.info(f"Detected {len(boxes)} boxes")

        # fallback: if no boxes, OCR whole image without per-crop preprocessing
        if not boxes:
            text = extract_text_simple(tmp_path)
            ocr_results = [{"segment_id": 1, "text": text, "box": None}]
        else:
            # 2) For each box: crop, optionally preprocess, then OCR
            # We will pass preprocessing functions to extract_text_from_segments to apply per-crop.
            preprocess_fns = None
            if do_preprocess_crops:
                # use functions that accept numpy arrays and return arrays
                preprocess_fns = [remove_bullets_symbols, remove_drawing_lines]

            # extract_text_from_segments will apply preprocess_fns per crop then OCR
            ocr_results = extract_text_from_segments(tmp_path, boxes, preprocess_fn_list=preprocess_fns)

        # 3) Classify segments
        classified = classify_segments(ocr_results)

        # 4) Run NER pipeline + normalization
        normalized = run_full_resume_pipeline(classified)

        # 5) Build final API response
        final_json = build_final_response(normalized)
        return final_json
    except Exception as e:
        logger.exception("Error in process_image_resume")
        raise
    finally:
        # cleanup temp files
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        # if any intermediate saved images exist, try to remove (preprocessors may have saved if called with save_path)
        for p in cleaned_crop_tempfiles:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
