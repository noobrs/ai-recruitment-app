from __future__ import annotations
import os
import tempfile
from typing import Dict, List
from pathlib import Path

from api.pdf.resume_builder import build_activities, build_certifications, build_education, build_experience, build_skills, build_languages, extract_candidate_info
from api.pdf.utils import convert_resume_dict_to_api_response
from api.types.types import ApiResponse, ResumeData, CandidateOut
from .layout_extraction import load_doc_with_layout, group_spans_by_heading
from .gliner_extraction import get_gliner, run_gliner_on_group


def process_pdf_resume(file_bytes: bytes):
    """
    End-to-end pipeline for PDF-based resume extraction.
    Returns resume JSON similar to image pipeline structure.
    
    Args:
        file_bytes: PDF file content as bytes
    
    Returns:
        ApiResponse containing the extracted resume data or error message.
    """
    # Write bytes to temp file
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)
    
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        
        # Load document with layout analysis
        doc = load_doc_with_layout(pdf_path)
        groups: List[Dict] = group_spans_by_heading(doc)
        
        # Run GLiNER entity extraction on each group
        gliner = get_gliner()
        for g in groups:
            result = run_gliner_on_group(
                gliner,
                heading=g["heading"],
                body=g["text"],
            )
            g["entities"] = result["entities"]
        

        full_text = doc.text or ""
        candidate = extract_candidate_info(full_text, gliner)
        skills = build_skills(groups)
        languages = build_languages(groups)
        education = build_education(groups)
        experience = build_experience(groups)
        certifications = build_certifications(groups)
        activities = build_activities(groups)

        resume_data = convert_resume_dict_to_api_response({
            "candidate": candidate,
            "education": education,
            "experience": experience,
            "skills": skills,
            "languages": languages,
            "certifications": certifications,
            "activities": activities,
        })

        return ApiResponse(status="success", data=resume_data)
        
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


# async def parse_resume_from_url(
#     pdf_url: str,
#     thr_skill: float = THR_SKILL,
#     thr_degree: float = THR_DEGREE,
#     thr_title: float = THR_TITLE,
#     thr_lang: float  = THR_LANG,
# ) -> ParseResult:
#     """
#     End-to-end: download -> layout -> grouping -> GLiNER -> aggregate.
#     Returns a dict suitable for DB storage / API response.
#     """
#     pdf_path = await fetch_pdf_to_tmp(pdf_url)
#     try:
#         doc = load_doc_with_layout(pdf_path)
#         groups: List[GroupBlock] = group_spans_by_heading(doc)

#         gliner = get_gliner()
#         for g in groups:
#             g.entities = run_gliner_on_group(
#                 gliner,
#                 heading=g.heading,
#                 body=g.text,
#                 thr_skill=thr_skill,
#                 thr_degree=thr_degree,
#                 thr_title=thr_title,
#                 thr_lang=thr_lang,
#             )

#         aggregated = aggregate_for_db(groups)
#         return {
#             "source_url": pdf_url,
#             "grouped_blocks": groups,
#             "aggregated_for_db": aggregated,
#         }
#     finally:
#         try:
#             pdf_path.unlink(missing_ok=True)
#         except Exception:
#             pass
