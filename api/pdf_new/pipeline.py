"""
Main PDF resume extraction pipeline.
Orchestrates layout parsing, entity extraction, section classification, and redaction.
"""

import os
import tempfile
from pathlib import Path
from typing import Dict

from api.types.types import ApiResponse
from api.pdf_new.layout_parser import load_pdf_with_layout, group_spans_by_heading
from api.pdf_new.entity_extraction import load_gliner_model, extract_entities_from_group
from api.pdf_new.section_classifier import classify_all_sections
from api.pdf_new.resume_builder import (
    extract_candidate_info,
    build_skills,
    build_languages,
    build_education,
    build_experience,
    build_certifications,
    build_activities,
)
from api.pdf_new.redaction import redact_pdf
from api.pdf_new.utils import convert_to_resume_data


def process_pdf_resume(file_bytes: bytes) -> ApiResponse:
    """
    Main pipeline for processing PDF resumes.

    Pipeline steps:
    1. Parse PDF layout and group text by headings
    2. Classify section types using GLiNER (replaces hardcoded keywords)
    3. Extract entities from each section
    4. Extract candidate information
    5. Build structured resume data (skills, education, experience, etc.)
    6. Redact sensitive information
    7. Upload redacted PDF and return results

    Args:
        file_bytes: PDF file as bytes

    Returns:
        ApiResponse with extracted resume data and redacted file URL
    """
    # Create temp file for PDF
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)

    try:
        # Write PDF to temp file
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)

        # Step 1: Parse PDF layout and group by headings
        print("[Pipeline] Parsing PDF layout...")
        doc = load_pdf_with_layout(str(pdf_path))
        groups = group_spans_by_heading(doc)

        # Step 2: Load GLiNER model (used for both classification and extraction)
        print("[Pipeline] Loading GLiNER model...")
        gliner = load_gliner_model()

        # Step 3: Classify section types (NEW: replaces hardcoded keyword matching)
        print("[Pipeline] Classifying section types...")
        groups = classify_all_sections(gliner, groups)

        # Step 4: Extract entities from each section
        print("[Pipeline] Extracting entities...")
        for group in groups:
            heading = group.get("heading", "")
            text = group.get("text", "")

            # Skip NO_HEADING groups
            if heading == "NO_HEADING":
                group["entities"] = []
                continue

            # Extract entities
            entities = extract_entities_from_group(gliner, heading, text)
            group["entities"] = entities

        # Step 5: Extract candidate information
        print("[Pipeline] Extracting candidate info...")
        full_text = doc.text or ""
        candidate = extract_candidate_info(full_text, gliner, doc)

        # Step 6: Build structured resume sections
        print("[Pipeline] Building resume sections...")
        skills = build_skills(groups)
        languages = build_languages(groups)
        all_skills = skills + languages

        education = build_education(groups)
        experience = build_experience(groups)
        certifications = build_certifications(groups)
        activities = build_activities(groups)

        # Convert to API response format
        resume_data = convert_to_resume_data({
            "candidate": candidate,
            "education": education,
            "experience": experience,
            "skills": all_skills,
            "certifications": certifications,
            "activities": activities,
        })

        # Step 7: Redact sensitive information
        print("[Pipeline] Redacting sensitive information...")
        candidate_regions = (
            candidate.get("regions") if isinstance(candidate, dict) else None
        )
        redaction_result = redact_pdf(file_bytes, candidate_regions)

        # Step 8: Upload redacted resume to storage
        redacted_file_url = None
        if redaction_result.get("status") == "success":
            redacted_bytes = redaction_result.get("redacted_resume_file")
            if redacted_bytes:
                from api.supabase_client import upload_redacted_resume_to_storage

                upload_result = upload_redacted_resume_to_storage(
                    file_bytes=redacted_bytes,
                    job_seeker_id=None  # Will be set by Next.js
                )

                if upload_result.get("status") == "success":
                    redacted_file_url = upload_result.get("signed_url")
                    print(f"[Pipeline] Redacted resume uploaded: {redacted_file_url}")
                else:
                    print(f"[Pipeline] Upload failed: {upload_result.get('message')}")

        # Return successful response
        return ApiResponse(
            status="success",
            data=resume_data,
            message=None,
            redacted_file_url=redacted_file_url,
        )

    except Exception as e:
        import traceback
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error in process_resume: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")

        return ApiResponse(
            status="error",
            data=None,
            message=str(e),
        )

    finally:
        # Cleanup temp file
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass
