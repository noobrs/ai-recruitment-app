from __future__ import annotations
from typing import List
from .config import THR_SKILL, THR_DEGREE, THR_TITLE, THR_LANG
from .types import GroupBlock, ParseResult
from .pdf_download import fetch_pdf_to_tmp
from .text_extraction import load_doc_with_layout, group_spans_by_heading
from .gliner_extraction import get_gliner, run_gliner_on_group
from .aggregate import aggregate_for_db

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
