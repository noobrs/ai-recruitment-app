"""
Main PDF resume extraction pipeline.
Orchestrates layout parsing, entity extraction, section classification, and redaction.
"""

import json
import os
import re
import tempfile
from collections import defaultdict
from pathlib import Path
from typing import Dict, List

from api.types.types import ApiResponse
from api.pdf.layout_parser import load_pdf_with_layout, group_spans_by_heading
from api.pdf.entity_extraction import load_gliner_model, extract_entities_from_group
from api.pdf.section_classifier import classify_all_sections
from api.pdf.contact_extractor import extract_candidate_info
from api.pdf.resume_builder import (
    build_skills,
    build_languages,
    build_education,
    build_experience,
    build_certifications,
    build_activities,
)
from api.pdf.redaction import redact_pdf
from api.pdf.utils import convert_to_resume_data, normalize_text


def filter_duplicate_no_heading_groups(groups: List[Dict]) -> List[Dict]:
    """
    Filter NO_HEADING groups whose text appears as a heading in other groups.
    This removes duplicate content that was already categorized under a proper heading.

    Args:
        groups: List of grouped spans

    Returns:
        Filtered list of groups with duplicate NO_HEADING groups removed
    """
    # Collect all non-NO_HEADING headings (normalized)
    headings = set()
    for group in groups:
        heading = group.get("heading", "")
        if heading and heading != "NO_HEADING":
            normalized_heading = normalize_text(heading).lower()
            headings.add(normalized_heading)

    # Filter out NO_HEADING groups whose text appears as a heading
    filtered_groups = []
    for group in groups:
        heading = group.get("heading", "")
        text = group.get("text", "")

        if heading == "NO_HEADING":
            # Check if this NO_HEADING text appears as a heading elsewhere
            normalized_text = normalize_text(text).lower()
            
            # Check if the entire text or first line matches any heading
            first_line = text.split("\n")[0].strip() if text else ""
            normalized_first_line = normalize_text(first_line).lower()
            
            is_duplicate = (
                normalized_text in headings or
                normalized_first_line in headings or
                any(normalized_text.startswith(h) or h.startswith(normalized_text) 
                    for h in headings if len(normalized_text) > 10 and len(h) > 10)
            )
            
            if is_duplicate:
                print(f"[Pipeline] Filtering duplicate NO_HEADING: {first_line[:50]}...")
                continue

        filtered_groups.append(group)

    return filtered_groups


# def group_by_section_type(groups: List[Dict]) -> List[Dict]:
#     """
#     Group sections with the same section_type together before NER extraction.
#     This consolidates similar sections for more efficient processing.

#     Args:
#         groups: List of grouped spans with section_type classification

#     Returns:
#         List of groups with same section types merged together
#     """
#     # Group by section_type
#     type_groups = defaultdict(list)
    
#     for group in groups:
#         section_type = group.get("section_type")
#         heading = group.get("heading", "")
        
#         # Keep NO_HEADING and unclassified sections separate
#         if heading == "NO_HEADING" or not section_type:
#             type_groups[f"_individual_{id(group)}"].append(group)
#         else:
#             type_groups[section_type].append(group)

#     # Merge groups with same section_type
#     merged_groups = []
    
#     for section_type, group_list in type_groups.items():
#         # Skip individual groups (NO_HEADING or unclassified)
#         if section_type.startswith("_individual_"):
#             merged_groups.extend(group_list)
#             continue
        
#         # If only one group of this type, keep as is
#         if len(group_list) == 1:
#             merged_groups.append(group_list[0])
#             continue
        
#         # Merge multiple groups of the same type
#         merged_heading = f"{section_type.upper()}"
#         merged_text_parts = []
#         merged_segments = []
#         total_span_count = 0
#         all_labels = []
        
#         for group in group_list:
#             heading = group.get("heading", "")
#             text = group.get("text", "")
            
#             # Add heading as a separator if it's meaningful
#             if heading and heading != "NO_HEADING":
#                 merged_text_parts.append(heading)
            
#             if text:
#                 merged_text_parts.append(text)
            
#             merged_segments.extend(group.get("segments", []))
#             total_span_count += group.get("span_count", 0)
#             all_labels.extend(group.get("labels", []))
        
#         merged_group = {
#             "heading": merged_heading,
#             "text": "\n\n".join(merged_text_parts),
#             "section_type": section_type,
#             "span_count": total_span_count,
#             "labels": all_labels,
#             "segments": merged_segments,
#             "merged_from": len(group_list),
#         }
        
#         merged_groups.append(merged_group)
#         print(f"[Pipeline] Merged {len(group_list)} groups of type '{section_type}'")

#     return merged_groups


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

        # Step 3.1: Filter NO_HEADING groups that appear as headings in other groups
        print("[Pipeline] Filtering duplicate NO_HEADING texts...")
        groups = filter_duplicate_no_heading_groups(groups)

        # # Step 3.2: Group sections with same section_type together
        # print("[Pipeline] Grouping same section types...")
        # groups = group_by_section_type(groups)
        # print(json.dumps(groups, indent=2))

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

        # Step 5: Extract candidate information (returns list of candidates)
        print("[Pipeline] Extracting candidate info...")
        full_text = doc.text or ""
        candidates = extract_candidate_info(full_text, gliner, doc)

        # Use first candidate for backward compatibility with existing API
        primary_candidate = candidates[0] if candidates else {}

        # Step 6: Build structured resume sections
        print("[Pipeline] Building resume sections...")
        skills = build_skills(groups)
        languages = build_languages(groups)
        all_skills = skills + languages

        education = build_education(groups)
        experience = build_experience(groups)
        certifications = build_certifications(groups)
        activities = build_activities(groups)

        # Convert to API response format (using primary candidate)
        resume_data = convert_to_resume_data({
            "candidate": primary_candidate,
            "education": education,
            "experience": experience,
            "skills": all_skills,
            "certifications": certifications,
            "activities": activities,
        })

        # Step 7: Redact sensitive information for ALL candidates
        print("[Pipeline] Redacting sensitive information...")
        # Extract regions from all candidates
        candidates_regions = [
            candidate.get("regions")
            for candidate in candidates
            if candidate.get("regions")
        ]
        # Only pass if we have regions to redact
        candidates_regions = candidates_regions if candidates_regions else None
        redaction_result = redact_pdf(file_bytes, candidates_regions)

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
