import os
import cv2
import pytesseract
import logging

logger = logging.getLogger("api.image.ocr")
pytesseract.pytesseract.tesseract_cmd = os.environ.get("TESSERACT_PATH")

def basic_text_extraction(img_path: str) -> str:
    return pytesseract.image_to_string(img_path, lang="eng")

def crop_and_ocr_boxes(image_path, predictions, conf_threshold=0.6):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("cannot read image")

    h, w = image.shape[:2]
    results = []

    logger.info(f"[OCR] Starting segmented OCR on: {image_path}")
    logger.info(f"[OCR] Total predictions: {len(predictions)}")

    for i, pred in enumerate(predictions, 1):
        conf = pred.get("confidence", 0)
        if conf < conf_threshold:
            continue

        x_min = max(0, int(pred["x"] - pred["width"] / 2))
        y_min = max(0, int(pred["y"] - pred["height"] / 2))
        x_max = min(w, int(pred["x"] + pred["width"] / 2))
        y_max = min(h, int(pred["y"] + pred["height"] / 2))

        crop = image[y_min:y_max, x_min:x_max]
        text = pytesseract.image_to_string(crop, lang="eng").strip()

        if text:
            logger.info(f"[OCR] Segment {i}: Extracted {len(text)} chars ✓")
        else:
            logger.warning(f"[OCR] Segment {i}: empty")

        results.append({
            "segment_id": i,
            "box": (x_min, y_min, x_max, y_max),
            "text": text,
            "confidence": conf
        })

    return results
