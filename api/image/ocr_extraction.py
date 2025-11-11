import cv2
import pytesseract
import platform
import shutil

if platform.system() == "Windows":
    path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    pytesseract.pytesseract.tesseract_cmd = path if shutil.which(path) else None

# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_segments(img_path: str, boxes):
    """Extract text from detected resume sections."""
    image = cv2.imread(img_path)
    ocr_results = []
    for i, (x1, y1, x2, y2) in enumerate(boxes, 1):
        crop = image[y1:y2, x1:x2]
        text = pytesseract.image_to_string(crop, lang="eng")
        ocr_results.append({"segment_id": i, "text": text.strip()})
    return ocr_results

def extract_text_simple(img_path: str):
    """Extract all text from the given image using Tesseract."""
    image = cv2.imread(img_path)
    if image is None:
        return {"error": "Image not found or invalid path"}
    text = pytesseract.image_to_string(image, lang="eng")
    return {"text": text.strip()}
