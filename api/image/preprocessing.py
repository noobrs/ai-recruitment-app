import cv2
import numpy as np
import pytesseract

# bullet and icon symbols to remove
BULLET_SYMBOLS = {'•', '-', '–', '—', '*', '▪', '●', '○', '.', '·', '¢',
                  'o', 'O', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}

def remove_bullets_symbols(img_path: str):
    """Removes bullets, icons, and faces from resume image."""
    image = cv2.imread(img_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # face removal
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 10)
    for (x, y, w, h) in faces:
        cv2.rectangle(image, (x - 100, y - 100), (x + w + 100, y + h + 100), (255, 255, 255), -1)

    # text removal (symbols)
    ocr_df = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DATAFRAME)
    ocr_df = ocr_df.dropna()

    for _, row in ocr_df.iterrows():
        x, y, w, h = int(row['left']), int(row['top']), int(row['width']), int(row['height'])
        text = str(row['text']).strip()
        conf = int(row['conf'])
        if (len(text) <= 2 and conf < 70) or (text in BULLET_SYMBOLS):
            cv2.rectangle(image, (x, y), (x + w, y + h), (255, 255, 255), -1)

    cv2.imwrite(img_path, image)
    return img_path


def remove_drawing_lines(img, save_path: str):
    """Removes lines and borders using morphological operations."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(~gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                   cv2.THRESH_BINARY, 15, -2)

    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (img.shape[1] // 30, 1))
    horiz = cv2.erode(thresh, horiz_kernel, iterations=2)
    horiz = cv2.dilate(horiz, horiz_kernel, iterations=2)

    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, img.shape[0] // 30))
    vert = cv2.erode(thresh, vert_kernel, iterations=1)
    vert = cv2.dilate(vert, vert_kernel, iterations=1)

    line_mask = cv2.bitwise_or(horiz, vert)
    dilated = cv2.dilate(line_mask, np.ones((3, 3), np.uint8), iterations=1)
    cleaned = cv2.inpaint(img, dilated, inpaintRadius=2, flags=cv2.INPAINT_TELEA)

    cv2.imwrite(save_path, cleaned)
    return save_path
