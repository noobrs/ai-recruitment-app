import logging
from .preprocessing import (
    save_temp_image_bytes, mask_to_detected_boxes, 
    remove_drawing_lines, remove_bullets_symbols, 
    enhance_image_clahe, sharpen_image
)
from .segmentation import run_detection, detections_to_predictions
from .ocr import crop_and_ocr_boxes
from .cleaning import clean_ocr_text
from .classifier import load_text_classifier, classify_text
from .extraction import run_full_resume_pipeline
from .builder import build_final_response

logger = logging.getLogger("api.image.pipeline")

def process_image_resume(file_bytes: bytes):
    tmp_path = save_temp_image_bytes(file_bytes, ext="jpg")

    detection_result = run_detection(tmp_path)
    predictions = detections_to_predictions(detection_result)

    segmented_path = mask_to_detected_boxes(tmp_path, predictions)
    cleaned = remove_drawing_lines(segmented_path)

    for _ in range(5):
        cleaned = remove_bullets_symbols(cleaned)

    cleaned = enhance_image_clahe(cleaned)
    # cleaned = sharpen_image(cleaned)

    ocr_results = crop_and_ocr_boxes(cleaned, predictions)

    classifier = load_text_classifier()
    classified_segments = []

    for seg in ocr_results:
        text = seg.get("text","").strip()
        if not text:
            continue

        label, score = classify_text(text, classifier)
        segment_text = clean_ocr_text(text)

        classified_segments.append({
            "segment_id": seg["segment_id"],
            "label": label,
            "score": score,
            "text": segment_text
        })

    normalized = run_full_resume_pipeline(classified_segments)
    final = build_final_response(normalized)
    return final
