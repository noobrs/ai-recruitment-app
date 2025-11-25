"""
Helpers for working with spaCy-Layout:
- Loading a PDF into a Doc
- Grouping layout spans by their inferred headings
- Exposing coordinates for each text span
"""

from collections import defaultdict
from typing import Dict, List, Optional, Any

import spacy
from spacy_layout import spaCyLayout

from api.pdf.config import SKIP_SPAN_LABELS
from api.pdf.utils import normalize_heading


# Lazy singletons
_NLP = None
_LAYOUT: spaCyLayout | None = None


def _get_layout() -> spaCyLayout:
    global _NLP, _LAYOUT
    if _LAYOUT is None:
        _NLP = spacy.blank("en")
        _LAYOUT = spaCyLayout(_NLP)
    return _LAYOUT


def load_doc_with_layout(pdf_path: str) -> spacy.tokens.Doc:
    """
    Run spaCy-Layout pipeline on a PDF file path to produce a spaCy Doc
    with layout spans (doc.spans["layout"]).
    """
    layout = _get_layout()
    return layout(pdf_path)


def _extract_bbox_from_layout(layout_obj: Any) -> Optional[Dict[str, float]]:
    """
    Best-effort extraction of (page, x0, y0, x1, y1) from span._.layout.

    spaCy-Layout may expose slightly different attribute names depending
    on the backend; this helper tries the common ones.
    """
    if layout_obj is None:
        return None

    # Page number
    page_num = getattr(layout_obj, "page_number", None)
    if page_num is None:
        page_num = getattr(layout_obj, "page", None)
    if page_num is None:
        page_index = 0
    else:
        # most layout libs use 1-based page index
        page_index = max(0, int(page_num) - 1)

    # Bounding box
    bbox = getattr(layout_obj, "bbox", None)
    if bbox is None:
        bbox = getattr(layout_obj, "rect", None)
    if bbox is None:
        # Sometimes x0,y0,x1,y1 stored separately
        maybe = (
            getattr(layout_obj, "x0", None),
            getattr(layout_obj, "y0", None),
            getattr(layout_obj, "x1", None),
            getattr(layout_obj, "y1", None),
        )
        if all(v is not None for v in maybe):
            bbox = maybe

    if bbox is None:
        return None

    x0, y0, x1, y1 = bbox
    return {
        "page": float(page_index),
        "x0": float(x0),
        "y0": float(y0),
        "x1": float(x1),
        "y1": float(y1),
    }


def group_spans_by_heading(doc: spacy.tokens.Doc) -> List[Dict]:
    """
    Group layout spans in the Doc by their inferred heading.

    Each group contains:
      - heading: normalized heading text (or 'NO_HEADING')
      - text: concatenated text of spans in reading order
      - span_count: how many spans
      - labels: list of the original layout labels
      - segments: list of span-level items with coordinates:
          {
            "text": str,
            "label": str,
            "bbox": {"page", "x0", "y0", "x1", "y1"} | None
          }
    """
    groups = defaultdict(list)

    for span in doc.spans["layout"]:
        if span.label_ in SKIP_SPAN_LABELS:
            continue

        head_span = span._.heading  # may be None
        head_text = normalize_heading(
            head_span.text if head_span is not None else None
        )
        groups[head_text].append(span)

    grouped: List[Dict] = []
    for head_text, spans in groups.items():
        spans_sorted = sorted(spans, key=lambda s: (s.start_char, s.end_char))

        text_lines = []
        segments = []
        for s in spans_sorted:
            s_text = (s.text or "").strip()
            if not s_text:
                continue
            text_lines.append(s_text)

            layout_obj = getattr(s._, "layout", None)
            bbox = _extract_bbox_from_layout(layout_obj)

            segments.append(
                {
                    "text": s_text,
                    "label": s.label_,
                    "bbox": bbox,
                }
            )

        group_text = "\n".join(text_lines)

        grouped.append(
            {
                "heading": head_text,
                "text": group_text,
                "span_count": len(spans_sorted),
                "labels": [s.label_ for s in spans_sorted],
                "segments": segments,
            }
        )

    # Sort so that title/summary/profile comes first, then others by length
    grouped.sort(
        key=lambda g: (
            0
            if g["heading"].lower().startswith(("title", "summary", "profile"))
            else 1,
            len(g["text"]),
        )
    )
    return grouped
