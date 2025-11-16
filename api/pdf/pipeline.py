from __future__ import annotations
import os
import tempfile
from typing import List
from pathlib import Path
from .config import THR_SKILL, THR_DEGREE, THR_TITLE, THR_LANG
from .types import GroupBlock, ParseResult
from .pdf_download import fetch_pdf_to_tmp
from .text_extraction import load_doc_with_layout, group_spans_by_heading
from .gliner_extraction import get_gliner, run_gliner_on_group
from .aggregate import aggregate_for_db


def process_pdf_resume(
    file_bytes: bytes,
    thr_skill: float = THR_SKILL,
    thr_degree: float = THR_DEGREE,
    thr_title: float = THR_TITLE,
    thr_lang: float = THR_LANG,
):
    """
    End-to-end pipeline for PDF-based resume extraction.
    Returns resume JSON similar to image pipeline structure.
    
    Args:
        file_bytes: PDF file content as bytes
        thr_skill: Threshold for skill entity detection
        thr_degree: Threshold for degree entity detection
        thr_title: Threshold for job title entity detection
        thr_lang: Threshold for language entity detection
    
    Returns:
        dict with status and data containing skills, education, experience
    """
    # Write bytes to temp file
    fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="resume_")
    pdf_path = Path(tmp_path)
    
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)
        
        # Load document with layout analysis
        doc = load_doc_with_layout(pdf_path)
        groups: List[GroupBlock] = group_spans_by_heading(doc)
        
        # Run GLiNER entity extraction on each group
        gliner = get_gliner()
        for g in groups:
            g.entities = run_gliner_on_group(
                gliner,
                heading=g.heading,
                body=g.text,
                thr_skill=thr_skill,
                thr_degree=thr_degree,
                thr_title=thr_title,
                thr_lang=thr_lang,
            )
        
        # Aggregate results for structured output
        aggregated = aggregate_for_db(groups)
        
        # Format output similar to image pipeline (with structured objects)
        resume_json = {
            "skills": [item["text"] for item in aggregated["skills"]],
            "education": [
                {
                    "degree": item["text"],
                    "institution": None,
                    "dates": []
                }
                for item in aggregated["education_majors"]
            ],
            "experience": [
                {
                    "job_title": item["text"],
                    "company": None,
                    "dates": [],
                    "achievements": None
                }
                for item in aggregated["experience_titles"]
            ],
        }
        
        return {"status": "success", "data": resume_json}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass


async def parse_resume_from_url(
    pdf_url: str,
    thr_skill: float = THR_SKILL,
    thr_degree: float = THR_DEGREE,
    thr_title: float = THR_TITLE,
    thr_lang: float  = THR_LANG,
) -> ParseResult:
    """
    End-to-end: download -> layout -> grouping -> GLiNER -> aggregate.
    Returns a dict suitable for DB storage / API response.
    """
    pdf_path = await fetch_pdf_to_tmp(pdf_url)
    try:
        doc = load_doc_with_layout(pdf_path)
        groups: List[GroupBlock] = group_spans_by_heading(doc)

        gliner = get_gliner()
        for g in groups:
            g.entities = run_gliner_on_group(
                gliner,
                heading=g.heading,
                body=g.text,
                thr_skill=thr_skill,
                thr_degree=thr_degree,
                thr_title=thr_title,
                thr_lang=thr_lang,
            )

        aggregated = aggregate_for_db(groups)
        return {
            "source_url": pdf_url,
            "grouped_blocks": groups,
            "aggregated_for_db": aggregated,
        }
    finally:
        try:
            pdf_path.unlink(missing_ok=True)
        except Exception:
            pass
