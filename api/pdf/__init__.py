"""
PDF Resume Extraction Pipeline (New Version)

A robust, accurate PDF extraction pipeline for resume processing.

Features:
- spacy-layout for PDF text extraction with layout awareness
- GLiNER for section type classification and entity extraction
- Section-type-specific entity extraction for better accuracy
- Multiple education/experience record handling
- Person information extraction with regex validation
- Haar Cascade face detection for redaction
- Malaysia phone number format support
- Coordinate-based text redaction

Usage:
    from api.pdf_new import process_pdf_resume
    
    with open("resume.pdf", "rb") as f:
        result = process_pdf_resume(f.read())
    
    if result.status == "success":
        resume_data = result.data
        redacted_url = result.redacted_file_url

For debugging/testing:
    from api.pdf_new import extract_resume_data, get_text_groups
    
    # Get structured data without redaction
    resume = extract_resume_data(file_bytes)
    
    # Get raw text groups for debugging
    groups = get_text_groups(file_bytes)
"""

from api.pdf_new.pipeline import (
    process_pdf_resume,
    extract_resume_data,
    get_text_groups,
)

from api.pdf_new.models import (
    BoundingBox,
    TextSegment,
    Entity,
    TextGroup,
    RedactionRegion,
    PersonInfo,
    EducationRecord,
    ExperienceRecord,
    CertificationRecord,
    ActivityRecord,
    ExtractedResume,
)

from api.pdf_new.entity_extraction import (
    load_gliner_model,
    get_relevant_entity_labels,
)

from api.pdf_new.validators import (
    is_valid_email,
    extract_emails,
    is_valid_malaysia_phone,
    extract_phones,
    is_valid_degree,
    is_valid_date,
)

__all__ = [
    # Main pipeline
    "process_pdf_resume",
    "extract_resume_data",
    "get_text_groups",
    
    # Models
    "BoundingBox",
    "TextSegment",
    "Entity",
    "TextGroup",
    "RedactionRegion",
    "PersonInfo",
    "EducationRecord",
    "ExperienceRecord",
    "CertificationRecord",
    "ActivityRecord",
    "ExtractedResume",
    
    # Entity extraction
    "load_gliner_model",
    "get_relevant_entity_labels",
    
    # Validators
    "is_valid_email",
    "extract_emails",
    "is_valid_malaysia_phone",
    "extract_phones",
    "is_valid_degree",
    "is_valid_date",
]

