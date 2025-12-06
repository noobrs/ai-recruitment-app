"""
Main PDF resume extraction pipeline (Simplified Version).
Orchestrates layout parsing, section classification, entity extraction, and redaction.

Features:
- Uses spacy-layout for PDF text extraction
- Groups text by headings
- Uses BART-large-MNLI to classify headings into section types (zero-shot classification)
- Uses GLiNER for entity extraction
- Merges groups by section type
- Section-type-specific entity extraction
- Multiple education/experience record handling
- Person info extraction for redaction
- Haar Cascade face detection
- Regex validation for emails, phones, degrees, dates

Assumptions:
- Single page resume (uses first page if multi-page)
- English only
"""

import logging
import os
import tempfile
import traceback
from pathlib import Path
from typing import Any, Dict, Optional

from api.types.types import ApiResponse

from api.pdf.layout_parser import (
    load_pdf_first_page,
    group_spans_by_heading,
)
from api.pdf.section_classifier import classify_and_merge_sections
from api.pdf.entity_extraction import (
    extract_entities_for_all_sections,
    load_gliner_model,
)
from api.pdf.person_extractor import extract_person_info
from api.pdf.resume_builder import (
    build_activities,
    build_certifications,
    build_education,
    build_experience,
    build_skills,
)
from api.pdf.redaction import redact_pdf
from api.pdf.models import ExtractedResume


logger = logging.getLogger(__name__)


# =============================================================================
# Result Conversion
# =============================================================================

def _convert_to_api_response(resume: ExtractedResume) -> Dict[str, Any]:
    """
    Convert ExtractedResume to the API response format.
    Matches the existing API contract for backward compatibility.
    
    Args:
        resume: ExtractedResume object
        
    Returns:
        Dict compatible with ResumeData Pydantic model
    """
    from api.types.types import (
        ResumeData,
        CandidateOut,
        EducationOut,
        ExperienceOut,
        CertificationOut,
        ActivityOut,
    )
    
    # Build candidate
    candidate = CandidateOut(
        name=resume.person.primary_name,
        email=resume.person.primary_email,
        phone=resume.person.primary_phone,
        location=resume.person.primary_location,
    )
    
    # Build education records
    education_out = [
        EducationOut(
            degree=e.degree,
            institution=e.institution,
            location=e.location,
            start_date=e.start_date,
            end_date=e.end_date,
            description=e.description,
        )
        for e in resume.education
    ]
    
    # Build experience records
    experience_out = [
        ExperienceOut(
            job_title=e.job_title,
            company=e.company,
            location=e.location,
            start_date=e.start_date,
            end_date=e.end_date,
            description=e.description,
        )
        for e in resume.experience
    ]
    
    # Build certifications
    certifications_out = [
        CertificationOut(
            name=c.name,
            description=c.description,
        )
        for c in resume.certifications
    ]
    
    # Build activities
    activities_out = [
        ActivityOut(
            name=a.name,
            description=a.description,
        )
        for a in resume.activities
    ]
    
    return ResumeData(
        candidate=candidate,
        education=education_out,
        experience=experience_out,
        skills=resume.skills,
        certifications=certifications_out,
        activities=activities_out,
    )


# =============================================================================
# Main Pipeline
# =============================================================================

def process_pdf_resume(file_bytes: bytes) -> ApiResponse:
    """
    Main pipeline for processing PDF resumes.
    
    Pipeline Steps:
    1. Load PDF and extract layout (first page only)
    2. Load GLiNER model
    3. Group spans by heading
    4. Classify headings and merge by section type
    5. Extract entities based on section type
    6. Extract person information for redaction
    7. Build structured resume data
    8. Redact sensitive information and faces
    9. Upload and return results
    
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
        
        print("[Pipeline] Step 2: Loading GLiNER model...")
        gliner = load_gliner_model()
        
        print("[Pipeline] Step 3: Grouping spans by heading...")
        heading_groups = group_spans_by_heading(doc)
        print(f"[Pipeline] Found {len(heading_groups)} heading groups")
        
        print("[Pipeline] Step 4: Classifying and merging by section...")
        groups = classify_and_merge_sections(heading_groups)
        print(f"[Pipeline] Created {len(groups)} section groups")
        _log_groups(groups)
        
        print("[Pipeline] Step 5: Extracting entities by section type...")
        groups = extract_entities_for_all_sections(gliner, groups)
        _log_entity_counts(groups)
        
        print("[Pipeline] Step 6: Extracting person information...")
        person_info = extract_person_info(groups, gliner)
        print(f"[Pipeline] Found: names={person_info.names}, emails={person_info.emails}, "
              f"phones={person_info.phones}, locations={person_info.locations}")
        
        print("[Pipeline] Step 7: Building structured resume data...")
        skills = build_skills(groups)
        education = build_education(groups)
        experience = build_experience(groups)
        certifications = build_certifications(groups)
        activities = build_activities(groups)
        
        print(f"[Pipeline] Built: {len(skills)} skills, {len(education)} education, "
              f"{len(experience)} experience, {len(certifications)} certs, {len(activities)} activities")
        
        # Create ExtractedResume
        resume = ExtractedResume(
            person=person_info,
            education=education,
            experience=experience,
            skills=skills,
            certifications=certifications,
            activities=activities,
            raw_groups=groups,
        )
        
        # Convert to API format
        resume_data = _convert_to_api_response(resume)
        
        print("[Pipeline] Step 8: Redacting sensitive information...")
        redaction_result = redact_pdf(file_bytes, person_info)
        
        # Handle redaction result
        redacted_file_url = None
        if redaction_result.get("status") == "success":
            redacted_bytes = redaction_result.get("redacted_resume_file")
            if redacted_bytes:
                from api.supabase_client import upload_redacted_resume_to_storage
                
                upload_result = upload_redacted_resume_to_storage(
                    file_bytes=redacted_bytes,
                    job_seeker_id=None,  # Will be set by frontend
                )
                
                if upload_result.get("status") == "success":
                    redacted_file_url = upload_result.get("signed_url")
                    print(f"[Pipeline] Redacted resume uploaded: {redacted_file_url}")
                else:
                    print(f"[Pipeline] Upload failed: {upload_result.get('message')}")
        elif redaction_result.get("status") == "no_redaction_needed":
            print("[Pipeline] No redaction needed, using original file")
            # Upload original if no redaction needed
            from api.supabase_client import upload_redacted_resume_to_storage
            
            upload_result = upload_redacted_resume_to_storage(
                file_bytes=file_bytes,
                job_seeker_id=None,
            )
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
        print(f"[Pipeline]   Section '{group.heading}': {len(group.text)} chars, {len(group.segments)} segments")


def _log_entity_counts(groups):
    """Log entity extraction counts per group."""
    for group in groups:
        entity_count = len(group.entities)
        if entity_count > 0:
            labels = set(e.label for e in group.entities)
            print(f"[Pipeline]   Section '{group.heading}': {entity_count} entities ({', '.join(labels)})")
