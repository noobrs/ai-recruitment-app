"""
PDF redaction functionality for candidate information and face detection.
Removes sensitive information from resume PDFs.
"""

import os
import tempfile
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import fitz  # PyMuPDF
import numpy as np

from api.pdf.models import PersonInfo, RedactionRegion


# =============================================================================
# Face Detection
# =============================================================================

def detect_face_regions(pdf_doc: fitz.Document) -> List[RedactionRegion]:
    """
    Detect faces in PDF pages using OpenCV Haar Cascade.
    Only processes the first page (as per requirements).
    
    Args:
        pdf_doc: PyMuPDF Document object
        
    Returns:
        List of RedactionRegion objects for detected faces
    """
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    regions = []
    
    # Only process first page (index 0)
    if len(pdf_doc) < 1:
        return regions
    
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
        
        regions.append(RedactionRegion(
            page_index=0,
            bbox=(float(x0), float(y0), float(x1), float(y1)),
            info_type="face",
        ))
    
    return regions


# =============================================================================
# Text Redaction
# =============================================================================

def apply_text_redactions(
    pdf_doc: fitz.Document,
    regions: List[RedactionRegion],
) -> None:
    """
    Apply text redactions to PDF by adding redaction annotations and applying them.
    
    Args:
        pdf_doc: PyMuPDF Document object
        regions: List of RedactionRegion objects to redact
    """
    if not regions:
        return
    
    # Group regions by page
    by_page: Dict[int, List[tuple]] = defaultdict(list)
    for region in regions:
        if region.bbox is not None:
            by_page[region.page_index].append(region.bbox)
    
    # Apply redactions page by page
    for page_index, bboxes in by_page.items():
        try:
            page = pdf_doc[page_index]
        except IndexError:
            continue
        
        for bbox in bboxes:
            rect = fitz.Rect(*bbox)
            page.add_redact_annot(rect, fill=(0, 0, 0))
        
        page.apply_redactions()


# =============================================================================
# Face/Image Removal
# =============================================================================

def apply_face_removal(
    pdf_doc: fitz.Document,
    regions: List[RedactionRegion],
) -> None:
    """
    Remove images containing detected faces from the PDF.
    Deletes the underlying image objects instead of just covering them.
    
    Args:
        pdf_doc: PyMuPDF Document object
        regions: List of RedactionRegion objects for faces
    """
    if not regions:
        return
    
    # Group face regions by page
    pages_to_process: Dict[int, List[fitz.Rect]] = {}
    for region in regions:
        page_idx = region.page_index
        if region.bbox:
            if page_idx not in pages_to_process:
                pages_to_process[page_idx] = []
            pages_to_process[page_idx].append(fitz.Rect(region.bbox))
    
    # Process each page
    for page_index, face_rects in pages_to_process.items():
        try:
            page = pdf_doc[page_index]
        except IndexError:
            continue
        
        # Get image info including xrefs
        image_infos = page.get_image_info(xrefs=True)
        xrefs_to_delete = set()
        
        for img_info in image_infos:
            img_bbox = fitz.Rect(img_info["bbox"])
            img_xref = img_info["xref"]
            
            # Check if any face region overlaps with this image
            for face_rect in face_rects:
                if img_bbox.intersects(face_rect):
                    xrefs_to_delete.add(img_xref)
                    break
        
        # Delete images containing faces
        for xref in xrefs_to_delete:
            try:
                page.delete_image(xref)
            except Exception as e:
                print(f"[Redaction] Failed to delete image xref {xref}: {e}")


# =============================================================================
# Main Redaction Function
# =============================================================================

def redact_pdf(
    file_bytes: bytes,
    person_info: Optional[PersonInfo] = None,
) -> Dict[str, Any]:
    """
    Redact candidate information and faces from a PDF.
    
    Args:
        file_bytes: PDF file as bytes
        person_info: PersonInfo object containing redaction regions
        
    Returns:
        Dict with:
        - status: "success", "no_redaction_needed", or "error"
        - redacted_resume_file: Redacted PDF bytes (or original if no redaction)
        - message: Error message if applicable
    """
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_redact_")
    pdf_path = Path(tmp_path)
    out_path: Optional[Path] = None
    
    try:
        # Write input PDF to temp file
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        
        # Open PDF
        pdf_doc = fitz.open(str(pdf_path))
        
        # Detect faces on first page
        face_regions = detect_face_regions(pdf_doc)
        
        # Get text redaction regions from person info
        text_regions = []
        if person_info and person_info.redaction_regions:
            # Filter to only text regions (not face)
            text_regions = [
                r for r in person_info.redaction_regions
                if r.info_type != "face"
            ]
        
        # Check if any redactions are needed
        if not text_regions and not face_regions:
            pdf_doc.close()
            return {
                "status": "no_redaction_needed",
                "redacted_resume_file": file_bytes,
                "message": "No candidate info or faces detected; original file returned.",
            }
        
        # Apply text redactions
        if text_regions:
            apply_text_redactions(pdf_doc, text_regions)
        
        # Apply face removal
        if face_regions:
            apply_face_removal(pdf_doc, face_regions)
        
        # Update PDF metadata
        pdf_doc.set_metadata({
            "title": "redacted-resume.pdf",
            "author": "",
            "subject": "Redacted Resume",
            "creator": "",
            "producer": "",
        })
        
        # Save redacted PDF
        out_path = pdf_path.with_name(pdf_path.stem + "_redacted.pdf")
        pdf_doc.save(str(out_path))
        pdf_doc.close()
        
        redacted_bytes = out_path.read_bytes()
        
        return {
            "status": "success",
            "redacted_resume_file": redacted_bytes,
            "message": None,
        }
    
    except Exception as e:
        import logging
        import traceback
        
        logger = logging.getLogger(__name__)
        logger.error(f"Error in redact_pdf: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            "status": "error",
            "redacted_resume_file": None,
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


def redact_pdf_with_regions(
    file_bytes: bytes,
    regions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Alternative redaction function that takes raw region dicts.
    Useful for backward compatibility.
    
    Args:
        file_bytes: PDF file as bytes
        regions: List of region dicts with page_index and bbox
        
    Returns:
        Dict with status, redacted_resume_file, and message
    """
    # Convert dicts to RedactionRegion objects
    redaction_regions = []
    for r in regions:
        redaction_regions.append(RedactionRegion(
            page_index=int(r.get("page_index", 0)),
            bbox=r.get("bbox"),
            info_type=r.get("info_type", "unknown"),
        ))
    
    # Create a PersonInfo with the regions
    person_info = PersonInfo(redaction_regions=redaction_regions)
    
    return redact_pdf(file_bytes, person_info)

