import logging
import os
import tempfile
import traceback
from pathlib import Path

from api.types.types import ApiResponse

from api.pdf.layout_parser import (
    load_pdf,
    group_spans_by_heading,
    preprocess_layout_doc,
)
from api.pdf.section_classifier import classify_text_groups, merge_text_groups, remove_common_span_label

from api.pdf.resume_builder import build_resume_data
from api.pdf.redaction import detect_person_spans, detect_face_regions, redact_pdf


logger = logging.getLogger(__name__)


# =============================================================================
# Main Pipeline
# =============================================================================

def process_pdf_resume(file_bytes: bytes) -> ApiResponse:

    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)
    
    try:
        # Write PDF to temp file
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        
        print("[PDF Pipeline] Step 1: Loading PDF layout...")
        doc = load_pdf(str(pdf_path))
        text_spans = preprocess_layout_doc(doc)
        
        print("[PDF Pipeline] Step 2: Grouping spans by heading (Initial TextGroups)...")
        groups = group_spans_by_heading(text_spans)
        
        print("[PDF Pipeline] Step 3: Classifying text groups by section...")
        groups = classify_text_groups(groups)
        groups = remove_common_span_label(groups)

        print(f"[PDF Pipeline] Step 4: Merging text groups...")
        groups = merge_text_groups(groups)
        
        print("[PDF Pipeline] Step 5: Redacting person information and face regions...")
        redaction_spans = detect_person_spans(groups)
        redaction_spans.extend(detect_face_regions(str(pdf_path)))
        redaction_result = redact_pdf(str(pdf_path), redaction_spans)
        
        print("[PDF Pipeline] Step 6: Building structured resume data...")
        resume_data = build_resume_data(groups, redaction_spans)
        
        print("[PDF Pipeline] Complete!")
        
        return ApiResponse(
            status="success",
            data=resume_data,
            message=None,
            redacted_file_url=redaction_result.get("redacted_file_url") if redaction_result.get("status") == "success" else None,
        )
    
    except Exception as e:
        logger.error(f"Error in process_pdf_resume: {str(e)}")
        logger.error(traceback.format_exc())
        
        return ApiResponse(
            status="error",
            data=None,
            message=str(e),
        )
    
    finally:
        # Cleanup
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass
