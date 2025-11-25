from __future__ import annotations

import os, re
import tempfile
from typing import Dict, List, Optional, Any
from pathlib import Path

import fitz  # PyMuPDF
import cv2
import numpy as np

from api.pdf.resume_builder import (
    build_activities,
    build_certifications,
    build_education,
    build_experience,
    build_skills,
    build_languages,
    extract_candidate_info,
)
from api.pdf.utils import convert_resume_dict_to_api_response
from api.types.types import ApiResponse, ResumeData
from .layout_extraction import load_doc_with_layout, group_spans_by_heading
from .gliner_extraction import get_gliner, run_gliner_on_group


# -----------------------------
# Main PDF resume extraction
# -----------------------------


def process_pdf_resume(file_bytes: bytes) -> ApiResponse:
    """
    End-to-end pipeline for PDF-based resume extraction.

    Follows this high-level algorithm:
      1. Save PDF bytes to a temp file.
      2. Parse layout with spaCy-Layout and group spans by heading
         (with coordinates preserved per span).
      3. Run GLiNER on each non-NO_HEADING group.
      4. Extract candidate info from full text.
      5. Build skills, education, experience, certifications, activities.
      6. Convert to API response structure.

    Returns:
        ApiResponse containing the extracted resume data or error message.
    """
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)

    try:
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)

        # 1) Layout analysis
        doc = load_doc_with_layout(str(pdf_path))
        groups: List[Dict] = group_spans_by_heading(doc)

        # 2) GLiNER on each non-NO_HEADING group
        gliner = get_gliner()
        for g in groups:
            heading = (g.get("heading") or "").upper()
            if heading == "NO_HEADING":
                # do not use this group for skills/edu/exp
                g["entities"] = []
                g["bias_hits"] = []
                g["sensitive"] = False
                continue

            result = run_gliner_on_group(
                gliner,
                heading=g["heading"],
                body=g["text"],
            )
            g["entities"] = result["entities"]
            g["bias_hits"] = result["bias_hits"]
            g["sensitive"] = result["sensitive"]

        # 3) Candidate info from the full raw text
        full_text = doc.text or ""
        candidate = extract_candidate_info(full_text, gliner, doc=doc)

        # 4) Structured sections
        skills = build_skills(groups)
        languages = build_languages(groups)
        all_skills = skills + languages

        education = build_education(groups)
        experience = build_experience(groups)
        certifications = build_certifications(groups)
        activities = build_activities(groups)

        resume_data: ResumeData = convert_resume_dict_to_api_response(
            {
                "candidate": candidate,
                "education": education,
                "experience": experience,
                "skills": all_skills,
                "certifications": certifications,
                "activities": activities,
            }
        )

        # 5) Redact the PDF resume (remove candidate info and faces)
        redaction_result = redact_pdf_resume(
            file_bytes,
            candidate,
            candidate_regions=(
                candidate.get("regions") if isinstance(candidate, dict) else None
            ),
        )

        # 6) Upload redacted resume to Supabase storage and get signed URL
        redacted_file_url = None
        if redaction_result.get('status') == 'success':
            redacted_file_bytes = redaction_result.get('redacted_resume_file')
            if redacted_file_bytes:
                from api.supabase_client import upload_redacted_resume_to_storage
                
                upload_result = upload_redacted_resume_to_storage(
                    file_bytes=redacted_file_bytes,
                    job_seeker_id=None  # Will be set by Next.js when saving to DB
                )
                
                if upload_result.get('status') == 'success':
                    redacted_file_url = upload_result.get('signed_url')
                    print(f"Redacted resume uploaded successfully: {redacted_file_url}")
                else:
                    print(f"Failed to upload redacted resume: {upload_result.get('message')}")
        
        # Match the JSON shape you described
        # {
        #   "status": "string",
        #   "data": { ... ResumeData ... },
        #   "message": "string",
        #   "redacted_file_url": "string" (optional)
        # }
        return ApiResponse(
            status="success", 
            data=resume_data, 
            message=None,
            redacted_file_url=redacted_file_url
        )

    except Exception as e:
        import traceback
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error in process_pdf_resume: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return ApiResponse(status="error", data=None, message=str(e))
    finally:
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass


# -----------------------------
# Candidate info + face redaction
# -----------------------------
def _normalize_phone(s: str) -> str:
    return "".join(ch for ch in s if ch.isdigit())


def _collect_candidate_regions(
    doc_spacy,
    candidate: Dict[str, Optional[str]],
) -> List[Dict[str, Any]]:
    """
    Use spaCy-Layout spans and candidate info to find regions that should be
    redacted (name, email, phone). This version is more robust:

      - Accepts dicts or Pydantic models (uses .dict() if present)
      - Name: all tokens must appear in span text (case-insensitive)
      - Email: simple lowercase substring match
      - Phone: digit-only comparison (handles spacing / brackets / dashes)
    """
    # Normalise candidate to a plain dict
    if candidate is None:
        candidate = {}
    elif not isinstance(candidate, dict):
        if hasattr(candidate, "dict"):
            candidate = candidate.dict()
        else:
            candidate = dict(candidate)

    name = (candidate.get("name") or "").strip()
    email = (candidate.get("email") or "").strip()
    phone = (candidate.get("phone") or "").strip()

    name_tokens = [t.lower() for t in re.split(r"\s+", name) if t] if name else []
    email_lower = email.lower() if email else ""
    phone_digits = _normalize_phone(phone) if phone else ""

    regions: List[Dict[str, Any]] = []

    if not (name_tokens or email_lower or phone_digits):
        return regions

    for span in doc_spacy.spans["layout"]:
        raw_text = span.text or ""
        text_lower = raw_text.lower()
        if not text_lower.strip():
            continue

        hit = False

        # Email: direct substring (case-insensitive)
        if email_lower and email_lower in text_lower:
            hit = True

        # Phone: digit-only substring match
        if not hit and phone_digits:
            span_digits = _normalize_phone(raw_text)
            if phone_digits and phone_digits in span_digits:
                hit = True

        # Name: require all tokens present in this span text
        if not hit and name_tokens:
            if all(tok in text_lower for tok in name_tokens):
                hit = True

        if not hit:
            continue

        layout_obj = getattr(span._, "layout", None)
        if layout_obj is None:
            continue

        # Page index
        page_num = getattr(layout_obj, "page_number", None)
        if page_num is None:
            page_num = getattr(layout_obj, "page", None)
        if page_num is None:
            page_index = 0
        else:
            page_index = max(0, int(page_num) - 1)

        # BBox from layout
        bbox = getattr(layout_obj, "bbox", None)
        if bbox is None:
            bbox = getattr(layout_obj, "rect", None)
        if bbox is None:
            maybe = (
                getattr(layout_obj, "x0", None),
                getattr(layout_obj, "y0", None),
                getattr(layout_obj, "x1", None),
                getattr(layout_obj, "y1", None),
            )
            if all(v is not None for v in maybe):
                bbox = maybe

        if bbox is None:
            continue

        x0, y0, x1, y1 = bbox

        # Slight padding to fully cover text
        pad = 1.0
        regions.append(
            {
                "page_index": page_index,
                "bbox": (
                    float(x0 - pad),
                    float(y0 - pad),
                    float(x1 + pad),
                    float(y1 + pad),
                ),
            }
        )

    return regions


def _detect_face_regions(pdf_doc: fitz.Document) -> List[Dict[str, Any]]:
    """
    Use OpenCV Haar Cascade to detect faces on each page image and map
    them back to PDF coordinates.
    """
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)

    regions: List[Dict[str, Any]] = []

    for page_index in range(len(pdf_doc)):
        page = pdf_doc[page_index]
        pix = page.get_pixmap()  # default matrix; resolution is fine

        img = np.frombuffer(pix.samples, dtype=np.uint8)
        img = img.reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40),
        )

        page_rect = page.rect
        img_h, img_w = gray.shape[:2]
        scale_x = page_rect.width / img_w
        scale_y = page_rect.height / img_h

        for (x, y, w, h) in faces:
            x0 = page_rect.x0 + x * scale_x
            y0 = page_rect.y0 + y * scale_y
            x1 = page_rect.x0 + (x + w) * scale_x
            y1 = page_rect.y0 + (y + h) * scale_y

            regions.append(
                {
                    "page_index": page_index,
                    "bbox": (float(x0), float(y0), float(x1), float(y1)),
                }
            )

    return regions


def _apply_redactions(pdf_doc: fitz.Document, regions: List[Dict[str, Any]]) -> None:
    """
    Add redaction annotations for candidate-info regions and apply them.
    (Faces are handled separately.)
    """
    if not regions:
        return

    from collections import defaultdict

    by_page: Dict[int, List[tuple]] = defaultdict(list)
    for r in regions:
        page_index = int(r["page_index"])
        bbox = r["bbox"]
        if bbox is None:
            continue
        by_page[page_index].append(bbox)

    for page_index, bboxes in by_page.items():
        try:
            page = pdf_doc[page_index]
        except IndexError:
            continue

        for bbox in bboxes:
            rect = fitz.Rect(*bbox)
            page.add_redact_annot(rect, fill=(0, 0, 0))

        # Apply once per page after adding all annotations
        page.apply_redactions()


def redact_pdf_resume(
    file_bytes: bytes,
    candidate: Optional[Dict[str, Optional[str]]] = None,
    candidate_regions: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Updated algorithm:

      - Candidate info (name/email/phone): redacted via PyMuPDF redactions.
      - Faces: detected via Haar cascade and directly removed by drawing
        white rectangles over those regions.

    Returns:
        {
          "status": "success" | "no_redaction_needed" | "error",
          "redacted_resume_file": bytes | None,
          "message": str | None
        }
    """
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_redact_")
    pdf_path = Path(tmp_path)
    out_path: Optional[Path] = None

    try:
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)

        # spaCy-Layout doc for coordinates
        doc_spacy = load_doc_with_layout(str(pdf_path))

        # Candidate info from caller or GLiNER
        if candidate is None:
            gliner = get_gliner()
            full_text = doc_spacy.text or ""
            candidate = extract_candidate_info(full_text, gliner, doc_spacy)

        # Open PDF with PyMuPDF
        pdf_doc = fitz.open(str(pdf_path))

        # Regions for candidate info (text) → redaction
        # Prefer pre-computed regions (either passed in explicitly or
        # attached on the candidate dict) and fall back to searching
        # via span text if nothing was provided.
        if candidate_regions is None and isinstance(candidate, dict):
            candidate_regions = candidate.get("regions")

        if candidate_regions is None:
            candidate_regions = _collect_candidate_regions(doc_spacy, candidate or {})

        # Regions for faces → direct removal
        face_regions = _detect_face_regions(pdf_doc)


        if not candidate_regions and not face_regions:
            pdf_doc.close()
            return {
                "status": "no_redaction_needed",
                "redacted_resume_file": file_bytes,
                "message": "No candidate info or faces detected; original file returned.",
            }

        # 1) Redact candidate text
        _apply_redactions(pdf_doc, candidate_regions)

        # 2) Directly remove faces by drawing over them
        _apply_face_removal(pdf_doc, face_regions)

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
        import traceback
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error in redact_pdf_resume: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "redacted_resume_file": None,
            "message": str(e),
        }
    finally:
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass
        if out_path is not None:
            try:
                out_path.unlink(missing_ok=True)
            except Exception:
                pass


import fitz  # PyMuPDF
from typing import List, Dict, Any

def _apply_face_removal(pdf_doc: fitz.Document, regions: List[Dict[str, Any]]) -> None:
    """
    Removes the underlying image objects that contain detected faces 
    based on the provided regions, instead of just drawing over them.
    """
    if not regions:
        return 
    
    # Group regions by page index to process each page only once
    # Structure: { page_index: [list_of_face_bboxes] }
    pages_to_process = {}
    for r in regions:
        p_idx = int(r["page_index"])
        if r["bbox"]:
            if p_idx not in pages_to_process:
                pages_to_process[p_idx] = []
            pages_to_process[p_idx].append(fitz.Rect(r["bbox"]))

    # Iterate through the pages that have detections
    for page_index, face_rects in pages_to_process.items():
        try:
            page = pdf_doc[page_index]
        except IndexError:
            continue

        # Get information about all images on this page, including their bbox and xref
        # xrefs=True is required to get the reference ID needed for deletion
        image_infos = page.get_image_info(xrefs=True)
        
        # Use a set to store xrefs to avoid trying to delete the same image twice 
        # (e.g., if two faces are detected in the same group photo)
        xrefs_to_delete = set()

        for img_info in image_infos:
            img_bbox = fitz.Rect(img_info["bbox"])
            img_xref = img_info["xref"]

            # Check if any detected face region overlaps with this image
            for face_rect in face_rects:
                # We check for intersection. If the face rect touches or is inside 
                # the image rect, we mark this image for deletion.
                if img_bbox.intersects(face_rect):
                    xrefs_to_delete.add(img_xref)
                    break # Found a match for this image, move to next image
        
        # Perform the actual deletion
        for xref in xrefs_to_delete:
            try:
                page.delete_image(xref)
            except Exception as e:
                print(f"Failed to delete image xref {xref} on page {page_index}: {e}")
