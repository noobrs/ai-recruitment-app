"""
PDF layout parsing using spaCy-Layout.
Extracts text spans with headings and coordinates.
"""

from collections import defaultdict
from typing import Dict, List, Optional, Any

import spacy
from spacy_layout import spaCyLayout

from api.pdf_new.config import SKIP_SPAN_LABELS
from api.pdf_new.utils import normalize_text


# Lazy-loaded singletons
_NLP = None
_LAYOUT: Optional[spaCyLayout] = None


def get_layout_parser() -> spaCyLayout:
    """Get or create the spaCy-Layout parser instance."""
    global _NLP, _LAYOUT
    if _LAYOUT is None:
        _NLP = spacy.blank("en")
        _LAYOUT = spaCyLayout(_NLP)
    return _LAYOUT


def load_pdf_with_layout(pdf_path: str) -> spacy.tokens.Doc:
    """
    Parse a PDF file and return a spaCy Doc with layout information.
    The Doc will have spans available at doc.spans["layout"].
    """
    parser = get_layout_parser()
    return parser(pdf_path)


def extract_bbox(layout_obj: Any) -> Optional[Dict[str, float]]:
    """
    Extract bounding box coordinates from a layout object.
    Returns dict with page, x0, y0, x1, y1 or None if not available.
    """
    if layout_obj is None:
        return None

    # Extract page number
    page_num = getattr(layout_obj, "page_number", None)
    if page_num is None:
        page_num = getattr(layout_obj, "page", None)
    if page_num is None:
        page_index = 0
    else:
        page_index = max(0, int(page_num) - 1)

    # Extract bounding box
    bbox = getattr(layout_obj, "bbox", None)
    if bbox is None:
        bbox = getattr(layout_obj, "rect", None)
    if bbox is None:
        # Try individual coordinate attributes
        x0 = getattr(layout_obj, "x0", None)
        y0 = getattr(layout_obj, "y0", None)
        x1 = getattr(layout_obj, "x1", None)
        y1 = getattr(layout_obj, "y1", None)
        if all(v is not None for v in [x0, y0, x1, y1]):
            bbox = (x0, y0, x1, y1)

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
    Group layout spans by their heading and preserve coordinates.

    Returns list of groups, each containing:
    - heading: heading text or 'NO_HEADING'
    - text: concatenated text content
    - span_count: number of spans in group
    - labels: list of span labels
    - segments: list of text segments with bboxes
    """
    groups = defaultdict(list)

    # Group spans by heading
    for span in doc.spans["layout"]:
        if span.label_ in SKIP_SPAN_LABELS:
            continue

        # Get heading for this span
        head_span = span._.heading
        head_text = normalize_text(head_span.text if head_span is not None else None)
        if not head_text:
            head_text = "NO_HEADING"

        groups[head_text].append(span)

    # Build group dictionaries
    result: List[Dict] = []
    for head_text, spans in groups.items():
        # Sort spans by position in document
        spans_sorted = sorted(spans, key=lambda s: (s.start_char, s.end_char))

        text_lines = []
        segments = []

        for span in spans_sorted:
            span_text = (span.text or "").strip()
            if not span_text:
                continue

            text_lines.append(span_text)

            # Extract coordinates
            layout_obj = getattr(span._, "layout", None)
            bbox = extract_bbox(layout_obj)

            segments.append({
                "text": span_text,
                "label": span.label_,
                "bbox": bbox,
            })

        group_text = "\n".join(text_lines)

        result.append({
            "heading": head_text,
            "text": group_text,
            "span_count": len(spans_sorted),
            "labels": [s.label_ for s in spans_sorted],
            "segments": segments,
        })

    # Sort by text length (longer sections tend to be more important)
    # Note: Removed hardcoded section name preferences
    result.sort(key=lambda g: -len(g["text"]))

    return result
