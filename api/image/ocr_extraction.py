"""
- basic_text_extraction: OCR whole image (fast test)
- extract_text_from_segments: OCR multiple crop boxes (list of [x1,y1,x2,y2])
    -> now supports per-crop preprocessing (callables that accept numpy array)
- extract_text_simple: wrapper to OCR a path or bytes
"""

import pytesseract
import cv2
import numpy as np
from typing import List, Tuple, Union, Callable, Optional
import io

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def basic_text_extraction(img_path_or_array) -> str:
    """OCR entire image and return string."""
    if isinstance(img_path_or_array, str):
        img = cv2.imread(img_path_or_array)
    else:
        img = img.copy()
    if img is None:
        return ""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray, lang='eng')
    return text

def _preprocess_crop_if_needed(crop: np.ndarray,
                              preprocess_fn_list: Optional[List[Callable[[np.ndarray], np.ndarray]]]=None):
    """
    Apply a list of preprocessing functions (in order) to a crop.
    Each function must accept and return a numpy image array.
    """
    img = crop.copy()
    if not preprocess_fn_list:
        return img
    for fn in preprocess_fn_list:
        try:
            img = fn(img)
        except Exception:
            # if a preprocessor fails, keep the previous image and continue
            continue
    return img

def extract_text_from_segments(img_path_or_array,
                               boxes: List[Tuple[int,int,int,int]],
                               preprocess_fn_list: Optional[List[Callable[[np.ndarray], np.ndarray]]] = None,
                               return_images: bool = False):
    """
    Given image path/array and list of boxes [[x1,y1,x2,y2],...], return list of dicts:
    {segment_id, box, text}
    - preprocess_fn_list: optional list of functions (np.ndarray -> np.ndarray) to apply per-crop before OCR
      e.g. [remove_bullets_symbols, remove_drawing_lines]
    - return_images: if True, returns cleaned crop images (useful for debugging)
    """
    if isinstance(img_path_or_array, str):
        img = cv2.imread(img_path_or_array)
    elif isinstance(img_path_or_array, (bytes, bytearray)):
        arr = np.frombuffer(img_path_or_array, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    else:
        img = img_path_or_array.copy()

    results = []
    h, w = img.shape[:2]
    for i, box in enumerate(boxes):
        try:
            x1, y1, x2, y2 = map(int, box)
        except Exception:
            continue
        # safety clamp
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        crop = img[y1:y2, x1:x2]
        if crop is None or crop.size == 0:
            txt = ""
            cleaned_crop = crop
        else:
            # Apply per-crop preprocessing if provided
            cleaned_crop = _preprocess_crop_if_needed(crop, preprocess_fn_list)
            gray = cv2.cvtColor(cleaned_crop, cv2.COLOR_BGR2GRAY)
            # You can tune pytesseract config if needed, e.g. psm or oem
            txt = pytesseract.image_to_string(gray, lang='eng')
        entry = {"segment_id": i+1, "box": (x1,y1,x2,y2), "text": txt.strip()}
        if return_images:
            entry["image"] = cleaned_crop
        results.append(entry)
    return results

def extract_text_simple_from_bytes(image_bytes: bytes):
    """Read bytes into numpy array and OCR full image."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return ""
    return basic_text_extraction(img)

def extract_text_simple(img_path_or_bytes):
    """Convenience wrapper: accepts local path or bytes or array."""
    if isinstance(img_path_or_bytes, (bytes, bytearray)):
        return extract_text_simple_from_bytes(img_path_or_bytes)
    return basic_text_extraction(img_path_or_bytes)
