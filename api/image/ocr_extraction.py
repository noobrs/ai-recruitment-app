import cv2
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # adjust if needed

def extract_text_from_segments(img_path: str, boxes):
    """Extract text from detected resume sections."""
    image = cv2.imread(img_path)
    ocr_results = []
    for i, (x1, y1, x2, y2) in enumerate(boxes, 1):
        crop = image[y1:y2, x1:x2]
        text = pytesseract.image_to_string(crop, lang="eng")
        ocr_results.append({"segment_id": i, "text": text.strip()})
    return ocr_results
