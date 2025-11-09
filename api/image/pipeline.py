import cv2
import numpy as np
from .preprocessing import remove_bullets_symbols, remove_drawing_lines
from .detection_model import detect_segments
from .ocr_extraction import extract_text_from_segments
from .text_classification import classify_segments
from .ner_extraction import extract_entities
from .builder import build_resume_json_v2

def process_image_resume(file_bytes: bytes):
    """End-to-end pipeline for image-based resume extraction."""
    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
    cleaned_path = "temp_cleaned_resume.jpg"

    remove_drawing_lines(img, cleaned_path)
    remove_bullets_symbols(cleaned_path)

    boxes = detect_segments(cleaned_path)
    ocr_results = extract_text_from_segments(cleaned_path, boxes)
    classified_segments = classify_segments(ocr_results)
    hybrid_results = extract_entities(classified_segments)
    resume_json = build_resume_json_v2(classified_segments, hybrid_results)

    return {"status": "success", "data": resume_json}
