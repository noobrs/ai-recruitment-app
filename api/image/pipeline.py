import os
import logging
import cv2
import tempfile

from api.image.builder import build_final_response, convert_image_resume_to_data
from api.types.types import ApiResponse


from .preprocessing import (
    mask_segments_on_image, save_temp_image_bytes, mask_to_detected_boxes,
    remove_drawing_lines, remove_bullets_symbols,
    adaptive_binarize_for_ocr, upscale_image_for_detection
)
from .segmentation import run_detection, detections_to_predictions
from .ocr import crop_and_ocr_boxes
from .cleaning import clean_ocr_text
from .classifier import load_text_classifier, classify_text
from .extraction import normalize_output, run_segment_ner

logger = logging.getLogger("api.image.pipeline")


def process_image_resume(file_bytes: bytes) -> ApiResponse:

    tmp_path = save_temp_image_bytes(file_bytes, ext="jpg")
    redacted_file_url = None

    try:
        tmp_path = upscale_image_for_detection(tmp_path, scale=2.0)
        
        # 1. YOLO LAYOUT DETECTION
        detection_result = run_detection(tmp_path)
        predictions = detections_to_predictions(detection_result)
        
        # 2. PREPROCESSING
        segmented_path = mask_to_detected_boxes(tmp_path, predictions)
        cleaned = remove_drawing_lines(segmented_path)

        for _ in range(3):
            cleaned = remove_bullets_symbols(cleaned)

        cleaned = adaptive_binarize_for_ocr(cleaned)

        # 3. OCR PER SEGMENT
        ocr_segments = crop_and_ocr_boxes(cleaned, predictions)

        # 4. CLASSIFY + CLEAN TEXT
        classifier = load_text_classifier()
        classified_segments = []

        for seg in ocr_segments:
            raw_text = seg.get("text", "").strip()
            if not raw_text:
                continue
            
            label, score = classify_text(raw_text, classifier)
            cleaned_text = clean_ocr_text(raw_text)

            classified_segments.append({
                "segment_id": seg["segment_id"],
                "label": label,
                "score": score,
                "text": cleaned_text
            })
            
        # debug logging
        for cs in classified_segments:
            logger.info(f"[Pipeline] Classified Segment: id={cs['segment_id']}, "
                        f"label={cs['label']}, score={cs['score']:.4f}, ")
            
        logger.info(predictions)

        # 5. MASK PI SEGMENTS
        cleaned = mask_segments_on_image(cleaned, predictions, classified_segments)

        # 6. SEGMENT NER
        clean_segments = []
        for seg in classified_segments:
            r = run_segment_ner(seg)
            clean_segments.append(r)

        # 7. NORMALIZE OUTPUT (YOUR LOGIC)
        normalized = normalize_output(clean_segments)

        # 8. CONVERT TO ResumeData MODEL
        resume_dict = build_final_response(normalized)
        resume_data = convert_image_resume_to_data(resume_dict)
        
        logging.info(f"[Pipeline] Normalized: {normalized}")

        # 9. CREATE REDACTED JPG
        cleaned_img = cv2.imread(cleaned)

        if cleaned_img is None:
            raise Exception("Failed to load cleaned image for redaction upload")

        _, enc = cv2.imencode(".jpg", cleaned_img)
        cleaned_bytes = enc.tobytes()

        # 10. UPLOAD REDACTED FILE
        from api.supabase_client import upload_redacted_resume_to_storage

        upload_result = upload_redacted_resume_to_storage(file_bytes=cleaned_bytes, file_type="jpg")

        if upload_result.get("status") == "success":
            redacted_file_url = upload_result.get("signed_url")
        else:
            logger.warning(f"[Pipeline] Upload failed: {upload_result}")

        # 11. RETURN FULL RESPONSE
        return ApiResponse(
            status="success",
            data=resume_data,
            message=None,
            redacted_file_url=redacted_file_url
        )

    except Exception as e:
        os.remove(tmp_path)
        os.remove(cleaned)
        logger.error(f"[IMAGE] Pipeline error: {e}")
        return ApiResponse(status="error", data=None, message=str(e))

    finally:
        try:
            os.remove(tmp_path)
            os.remove(cleaned)
        except:
            pass
