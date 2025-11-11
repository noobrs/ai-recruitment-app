# api/image/ocr_extraction.py
import cv2
import pytesseract
import platform
import shutil
from typing import List, Tuple

# Windows path detection (non-invasive)
if platform.system() == "Windows":
    candidate = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if shutil.which(candidate):
        pytesseract.pytesseract.tesseract_cmd = candidate

def extract_text_from_segments(img_path: str, boxes: List[Tuple[int,int,int,int]]):
    image = cv2.imread(img_path)
    if image is None:
        return {"error": "Image not found"}
    ocr_results = []
    for i, (x1, y1, x2, y2) in enumerate(boxes, 1):
        # safety clamp
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(image.shape[1], x2), min(image.shape[0], y2)
        crop = image[y1:y2, x1:x2]
        try:
            text = pytesseract.image_to_string(crop, lang="eng")
        except Exception:
            text = ""
        ocr_results.append({"segment_id": i, "text": text.strip(), "box": [x1,y1,x2,y2]})
    return ocr_results

def extract_text_simple(img_path: str):
    image = cv2.imread(img_path)
    if image is None:
        return {"error": "Image not found or invalid path"}
    try:
        text = pytesseract.image_to_string(image, lang="eng")
    except Exception:
        text = ""
    return {"text": text.strip()}
