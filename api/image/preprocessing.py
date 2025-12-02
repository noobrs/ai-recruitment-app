"""
- remove_bullets_symbols: remove small low-confidence OCR boxes & common bullet symbols
- remove_drawing_lines: detect & inpaint lines (cleaned up version)
Both functions accept either a filepath or numpy image array.
"""

import cv2
import numpy as np
import pytesseract
import matplotlib.pyplot as plt
from typing import Union
import os

# default Tesseract path — keep as you had it (change if needed)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

BULLET_CHARS = {'•', '-', '–', '—', '*', '▪', '●', '○', '.', '·'}

def _load_image(img: Union[str, np.ndarray]):
    if isinstance(img, str):
        return cv2.imread(img)
    return img.copy()

def remove_bullets_symbols(image_path_or_array, save_path=None, debug=False):
    """
    Remove bullets and low-confidence tiny OCR boxes.
    - image_path_or_array: file path or numpy array
    - save_path: optional path to save cleaned image
    - debug: if True, show debug plots
    Returns cleaned image (numpy array) and optionally saves to save_path.
    """
    img = _load_image(image_path_or_array)
    if img is None:
        raise ValueError("Image not found or unreadable.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # OCR with bounding box info
    ocr_df = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DATAFRAME)
    ocr_df = ocr_df[ocr_df['text'].notna()]

    draw_img = img.copy()
    # Remove boxes that look like icons / bullets or have low confidence & short length
    for _, row in ocr_df.iterrows():
        try:
            x, y, w, h = int(row['left']), int(row['top']), int(row['width']), int(row['height'])
            text = str(row['text']).strip()
            conf = int(row['conf']) if row['conf'] not in [None, ''] else 0
        except Exception:
            continue

        if (len(text) <= 2 and conf < 70) or (text in BULLET_CHARS):
            # whiten-out small boxes
            cv2.rectangle(draw_img, (x, y), (x + w, y + h), (255, 255, 255), -1)

    if save_path:
        cv2.imwrite(save_path, draw_img)
    if debug:
        plt.figure(figsize=(8, 12))
        plt.imshow(cv2.cvtColor(draw_img, cv2.COLOR_BGR2RGB))
        plt.axis("off")
        plt.title("Bullets/Icons Removed")
        plt.show()

    return draw_img

def remove_drawing_lines(image_path_or_array, save_path=None, debug=False):
    """
    Remove table-like lines by morphological ops + inpainting.
    Input: file path or numpy image array.
    Returns cleaned image (numpy array).
    """
    img = _load_image(image_path_or_array)
    if img is None:
        raise ValueError("Image not found or unreadable.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Invert and threshold to get strong lines
    thresh = cv2.adaptiveThreshold(~gray, 255,
                                   cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY, 15, -2)

    # horizontal structure
    horizontal_size = max(10, img.shape[1] // 30)
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horizontal_size, 1))
    horiz = cv2.erode(thresh, horiz_kernel, iterations=1)
    horiz = cv2.dilate(horiz, horiz_kernel, iterations=1)

    # vertical structure
    vertical_size = max(10, img.shape[0] // 30)
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vertical_size))
    vert = cv2.erode(thresh, vert_kernel, iterations=1)
    vert = cv2.dilate(vert, vert_kernel, iterations=1)

    line_mask = cv2.bitwise_or(horiz, vert)
    line_mask = cv2.dilate(line_mask, np.ones((3, 3), np.uint8), iterations=1)
    # Convert mask to 8-bit single channel
    mask_uint8 = (line_mask > 0).astype('uint8') * 255

    inpainted = cv2.inpaint(img, mask_uint8, inpaintRadius=2, flags=cv2.INPAINT_TELEA)

    if save_path:
        cv2.imwrite(save_path, inpainted)
    if debug:
        plt.figure(figsize=(8, 12))
        plt.imshow(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
        plt.axis("off")
        plt.title("Lines Removed (Inpainted)")
        plt.show()

    return inpainted
