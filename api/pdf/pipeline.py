import logging
import os
import tempfile
import traceback
from pathlib import Path
from typing import Any, Dict, List

from sympy import group

from api.types.types import ApiResponse

from api.pdf.layout_parser import (
    load_pdf_first_page,
    group_spans_by_heading,
)
from api.pdf.section_classifier import classify_and_merge_sections
from api.pdf.entity_extraction import extract_entities_for_all_sections
from api.pdf.person_extractor import extract_person_info
from api.pdf.resume_builder import build_resume_data
from api.pdf.redaction import redact_pdf
from api.pdf.models import HeadingGroup


logger = logging.getLogger(__name__)


# =============================================================================
# Main Pipeline
# =============================================================================

def process_pdf_resume(file_bytes: bytes) -> ApiResponse:
    """
    Main pipeline for processing PDF resumes.
    
    Pipeline Steps:
    1. Load PDF and extract layout (first page only)
    2. Group spans by heading
    3. Classify headings and merge by section type
    4. Extract entities based on section type (loads GLiNER internally)
    5. Extract person information for redaction
    6. Build structured resume data
    7. Redact sensitive information and faces
    8. Upload and return results
    
    Args:
        file_bytes: PDF file as bytes
        
    Returns:
        ApiResponse with extracted resume data and redacted file URL
    """
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)
    
    try:
        # Write PDF to temp file
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        
        print("[Pipeline] Step 1: Loading PDF layout...")
        doc = load_pdf_first_page(str(pdf_path))
        
        print("[Pipeline] Step 2: Grouping spans by heading...")
        heading_groups = group_spans_by_heading(doc)
        print(f"[Pipeline] Found {len(heading_groups)} heading groups")
        _log_heading_groups(heading_groups)
        
        print("[Pipeline] Step 3: Classifying and merging by section...")
        groups = classify_and_merge_sections(heading_groups)
        print(f"[Pipeline] Created {len(groups)} section groups")
        _log_groups(groups)
        
        print("[Pipeline] Step 4: Extracting entities by section type...")
        groups = extract_entities_for_all_sections(groups)
        _log_entity_counts(groups)
        
        print("[Pipeline] Step 5: Extracting person information...")
        person_info = extract_person_info(groups)
        print(f"[Pipeline] Found: names={person_info.names}, emails={person_info.emails}, "
              f"phones={person_info.phones}, locations={person_info.locations}\n")
        _log_person_info(person_info)
        
        print("[Pipeline] Step 6: Building structured resume data...")
        resume_data = build_resume_data(groups, person_info)
        
        print("[Pipeline] Step 7: Redacting sensitive information...")
        redaction_result = redact_pdf(file_bytes, person_info)
        
        # Handle redaction result
        redacted_file_url = None
        if redaction_result.get("status") == "success":
            redacted_bytes = redaction_result.get("redacted_resume_file")
            if redacted_bytes:
                from api.supabase_client import upload_redacted_resume_to_storage
                
                upload_result = upload_redacted_resume_to_storage(file_bytes=redacted_bytes, file_type="pdf")
                
                if upload_result.get("status") == "success":
                    redacted_file_url = upload_result.get("signed_url")
                    print(f"[Pipeline] Redacted resume uploaded: {redacted_file_url}")
                else:
                    print(f"[Pipeline] Upload failed: {upload_result.get('message')}")
        else:
            print("[Pipeline] No redaction needed, using original file")
            # Upload original if no redaction needed
            from api.supabase_client import upload_redacted_resume_to_storage
            
            upload_result = upload_redacted_resume_to_storage(file_bytes=file_bytes, file_type="pdf")

            if upload_result.get("status") == "success":
                redacted_file_url = upload_result.get("signed_url")
        
        print("[Pipeline] Complete!")
        
        return ApiResponse(
            status="success",
            data=resume_data,
            message=None,
            redacted_file_url=redacted_file_url,
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


# =============================================================================
# Debugging Helpers
# =============================================================================

def _log_groups(groups):
    """Log section groups."""
    for group in groups:
        print(f"[Pipeline]   Section '{group.heading}'\n {group.text}\n {len(group.segments)} segments\n\n")


def _log_entity_counts(groups):
    """Log entity extraction counts per group."""
    for group in groups:
        entity_count = len(group.entities)
        if entity_count > 0:
            print(f"[Pipeline]   Section '{group.heading}'")
            for e in group.entities:
                print(f"    - {e.label}: {e.text} (conf={e.score:.2f})")
            print("")

def _log_heading_groups(heading_groups: List[HeadingGroup]):
    """Log heading groups for debugging."""
    for group in heading_groups:
        print(f"[Pipeline]   Heading Group '{group.heading}'\n {group.text}\n")

def _log_person_info(person_info):
    for redaction_region in person_info.redaction_regions:
        print(f"[Pipeline]   Redaction Region: {redaction_region.info_type} at {redaction_region.bbox}")