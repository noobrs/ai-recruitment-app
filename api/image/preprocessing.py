import os
import cv2
import numpy as np
import pytesseract
import logging

logger = logging.getLogger("api.image.preprocessing")

TMP_DIR = "tmp"
RESUME_CLEANED = "cleaned_resume.jpg"
CLEANED_IMAGE_PATH = os.path.join(TMP_DIR, RESUME_CLEANED)

bullet_symbols = {
    '•','-','–','—','*','▪','●','○','.','·','¢','e','o','O',
    '0','1','2','3','4','5','6','7','8','9','@','#','$','%',
    '&','(',')','+','=', '>', '<','?','/','\\','{','}','[',
    ']',':',';','&','_'
}

def save_temp_image_bytes(file_bytes: bytes, ext="jpg"):
    os.makedirs(TMP_DIR, exist_ok=True)
    fname = f"tmp_{os.urandom(6).hex()}.{ext}"
    path = os.path.join(TMP_DIR, fname)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path

def mask_to_detected_boxes(img_path, predictions, output_path=CLEANED_IMAGE_PATH):
    image = cv2.imread(img_path)
    if image is None:
        raise ValueError("cannot read image")

    h, w = image.shape[:2]
    white_bg = np.ones((h, w, 3), dtype=np.uint8) * 255
    out = white_bg.copy()

    for pred in predictions:
        conf = pred.get("confidence", 0)
        if conf < 0.5:
            continue

        x = pred["x"]; y = pred["y"]
        bw = pred["width"]; bh = pred["height"]

        x_min = max(0, int(x - bw / 2))
        y_min = max(0, int(y - bh / 2))
        x_max = min(w, int(x + bw / 2))
        y_max = min(h, int(y + bh / 2))

        out[y_min:y_max, x_min:x_max] = image[y_min:y_max, x_min:x_max]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, out)
    logger.info(f"[Preprocess] Segmented image saved → {output_path}")
    return output_path

def remove_bullets_symbols(img_path, cleaned_image_path=CLEANED_IMAGE_PATH):
    image = cv2.imread(img_path)
    if image is None:
        raise ValueError("cannot read image")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    ocr_df = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DATAFRAME)
    ocr_df = ocr_df.dropna()
    ocr_df = ocr_df[ocr_df['text'].notna()]

    out = image.copy()

    for _, row in ocr_df.iterrows():
        x = int(row['left'])
        y = int(row['top'])
        w = int(row['width'])
        h = int(row['height'])
        text = str(row['text']).strip()

        try:
            conf = int(float(row['conf']))
        except:
            conf = 0

        if (len(text) <= 2 and conf < 70) or (text in bullet_symbols):
            cv2.rectangle(out, (x, y), (x + w, y + h), (255, 255, 255), -1)

    os.makedirs(os.path.dirname(cleaned_image_path), exist_ok=True)
    cv2.imwrite(cleaned_image_path, out)
    logger.info("[Preprocess] Bullet cleanup applied")
    return cleaned_image_path

def remove_drawing_lines(img_path, cleaned_image_path=CLEANED_IMAGE_PATH):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("cannot read image")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(~gray, 255, 
                                   cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY, 15, -2)

    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(1, img.shape[1] // 30), 1))
    horiz = cv2.dilate(cv2.erode(thresh, horiz_kernel, 2), horiz_kernel, 2)

    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(1, img.shape[0] // 30)))
    vert = cv2.dilate(cv2.erode(thresh, vert_kernel, 1), vert_kernel, 1)

    line_mask = cv2.bitwise_or(horiz, vert)
    line_mask = cv2.dilate(line_mask, np.ones((3, 3), np.uint8), 1)

    cleaned = cv2.inpaint(img, line_mask, inpaintRadius=2, flags=cv2.INPAINT_TELEA)

    os.makedirs(os.path.dirname(cleaned_image_path), exist_ok=True)
    cv2.imwrite(cleaned_image_path, cleaned)
    logger.info("[Preprocess] Lines removed")
    return cleaned_image_path

def enhance_image_clahe(img_path, cleaned_image_path=CLEANED_IMAGE_PATH):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("cannot read image")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # sharpened = cv2.filter2D(enhanced, -1, 
    #     np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    # )

    out = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

    os.makedirs(os.path.dirname(cleaned_image_path), exist_ok=True)
    cv2.imwrite(cleaned_image_path, out)
    logger.info("[Preprocess] CLAHE + Sharpen applied")
    return cleaned_image_path

def sharpen_image(img_path, cleaned_image_path=CLEANED_IMAGE_PATH):
    img = cv2.imread(img_path)
    kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    sharpened = cv2.filter2D(img, -1, kernel)

    os.makedirs(os.path.dirname(cleaned_image_path), exist_ok=True)
    cv2.imwrite(cleaned_image_path, sharpened)
    logger.info("[Preprocess] Final sharpening applied")
    return cleaned_image_path
