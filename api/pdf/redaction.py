import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import fitz  # PyMuPDF
import numpy as np

from api.pdf.config import EMAIL_RE, PHONE_RES
from api.pdf.entity_extraction import load_ner_model
from api.types.types import TextGroup, TextSpan
from api.supabase_client import upload_redacted_resume_to_storage


# =============================================================================
# Validation Helpers
# =============================================================================

def is_email(text: str) -> bool:
    if not text:
        return False
    
    matches = EMAIL_RE.findall(text)
    return len(matches) > 0


def is_phone(text: str) -> bool:
    if not text:
        return False
    
    for pattern in PHONE_RES:
        # We only need to find one match to return True
        if pattern.search(text): 
            return True
            
    return False

def is_valid_person(text: str) -> bool:
    # 1. Check if empty or None
    if not text:
        return False
    
    # 2. Check length (e.g., reject if over 50 characters)
    if len(text) > 50:
        return False

    # 3. Check if it contains any digits (0-9)
    # This covers "123" (all digits) and "John123" (mixed)
    if any(char.isdigit() for char in text):
        return False

    # 4. Check for valid characters
    # Allows: a-z, A-Z, spaces (\s), hyphens (-), and apostrophes (')
    # Disallows: @, !, #, $, etc.
    if not re.match(r"^[a-zA-Z\s'-]+$", text):
        return False

    return True


# =============================================================================
# Person Detection
# =============================================================================

def detect_person_spans(groups: List[TextGroup]) -> List[TextSpan]:
    # 1. Collect ALL groups that match "contact" or "summary"
    contact_groups = [group for group in groups if group.heading in ["contact", "NO_HEADING"]]
    
    spans_need_redaction = []

    ner_model = load_ner_model()

    # 2. Iterate through every matching group
    for group in contact_groups:
        print(f"Processing group: {group.heading}")
        person_spans = group.spans
        spans_needing_ner = []

        # --- Regex Pass ---
        for span in person_spans:
            if is_email(span.text):
                print(f"      • Regex Detected -> [Email] {span.text}")
                span.label = "email"
                spans_need_redaction.append(span)
                continue
            
            if is_phone(span.text):
                print(f"      • Regex Detected -> [Phone] {span.text}")
                span.label = "phone number"
                spans_need_redaction.append(span)
                continue
            
            spans_needing_ner.append(span)

        # --- NER Pass ---
        for span in spans_needing_ner:
            entities = ner_model.predict_entities(span.text, ["location", "person", "designation"])
            
            # Print findings for debugging
            for entity in entities:
                print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")
            
            # Determine redaction logic based on the top entity found
            if entities:
                top_entity = entities[0]
                if top_entity['label'] == "person" and not is_valid_person(top_entity['text']):
                    print(f"      • Skipping invalid person name: {top_entity['text']}")
                    continue
                # If the top entity is a designation
                if top_entity['label'] == "designation": 
                    continue
                span.label = top_entity['label']
                spans_need_redaction.append(span)

    return spans_need_redaction


# =============================================================================
# Face Detection
# =============================================================================

def detect_face_regions(pdf_path: str) -> List[TextSpan]:

    pdf_doc = fitz.open(str(pdf_path))
    try:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        regions = []
        
        page = pdf_doc[0]
        pix = page.get_pixmap()
        
        # Convert pixmap to numpy array
        img = np.frombuffer(pix.samples, dtype=np.uint8)
        img = img.reshape(pix.height, pix.width, pix.n)
        
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40),
        )
        
        # Convert pixel coordinates to PDF coordinates
        page_rect = page.rect
        img_h, img_w = gray.shape[:2]
        scale_x = page_rect.width / img_w
        scale_y = page_rect.height / img_h
        
        for (x, y, w, h) in faces:
            x0 = page_rect.x0 + x * scale_x
            y0 = page_rect.y0 + y * scale_y
            x1 = page_rect.x0 + (x + w) * scale_x
            y1 = page_rect.y0 + (y + h) * scale_y
            regions.append(TextSpan(
                text="face",
                label="face",
                bbox=(x0, y0, x1, y1)
            ))
        
        return regions

    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"Error in detect_face_regions: {str(e)}")
        logger.error(traceback.format_exc())
        
        return []
    
    finally:
        pdf_doc.close()


# =============================================================================
# Face/Image Removal
# =============================================================================

def remove_face_image(target_bbox: tuple, page: fitz.Page):
    target_rect = fitz.Rect(target_bbox)
    image_list = page.get_images()
    images_found = 0
    
    for img in image_list:
        xref = img[0]  # The unique reference ID of the image object
        
        # Find where this image is drawn on the page
        image_rects = page.get_image_rects(xref)
        for rect in image_rects:
            # Check if the image location matches or intersects your target BBox
            if rect.intersects(target_rect):
                page.delete_image(xref)
                images_found += 1
                break 

    return images_found


# =============================================================================
# Span Redaction Function
# =============================================================================

def redact_spans(spans: List[TextSpan], pdf_doc: fitz.Document) -> fitz.Document:
    page = pdf_doc[0]
    for span in spans:
        if span.label == "face":
            remove_face_image(span.bbox, page)
        elif span.bbox:
            page.add_redact_annot(span.bbox, fill=(0, 0, 0))

    page.apply_redactions()
    return pdf_doc


# =============================================================================
# Main Redaction Function
# =============================================================================

def redact_pdf(pdf_path: str, redacted_spans: List[TextSpan]) -> Dict[str, Any]:
    out_path = None
    try:
        pdf_doc = fitz.open(pdf_path)
        redacted_doc = redact_spans(redacted_spans, pdf_doc)

        redacted_doc.set_metadata({
            "title": "redacted-resume.pdf",
            "author": "",
            "subject": "Redacted Resume",
            "creator": "",
            "producer": "",
        })

        # Save redacted PDF
        pdf_path_obj = Path(pdf_path)
        out_path = pdf_path_obj.with_name(pdf_path_obj.stem + "_redacted.pdf")
        redacted_doc.save(str(out_path))
        redacted_doc.close()
        
        redacted_bytes = out_path.read_bytes()
        upload_result = upload_redacted_resume_to_storage(file_bytes=redacted_bytes, file_type="pdf")

        if upload_result.get("status") == "success":
            redacted_file_url = upload_result.get("signed_url")
            return {
                "status": "success",
                "redacted_file_url": redacted_file_url,
                "message": "Redaction and upload successful",
            }
        else:
            return {
                "status": "error",
                "redacted_file_url": None
            }

    except Exception as e:
        import logging
        import traceback
        
        logger = logging.getLogger(__name__)
        logger.error(f"Error in redact_pdf: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            "status": "error",
            "redacted_file_url": None,
            "message": str(e),
        }
    
    finally:
        # Cleanup temp files
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass
        
        if out_path is not None:
            try:
                out_path.unlink(missing_ok=True)
            except Exception:
                pass
