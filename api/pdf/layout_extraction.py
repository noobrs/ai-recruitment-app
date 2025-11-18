"""
Helpers for working with spaCy-Layout:
- Loading a PDF into a Doc
- Grouping layout spans by their inferred headings
"""

from collections import defaultdict
from typing import Dict, List

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
    with layout spans.
    """
    layout = _get_layout()
    return layout(pdf_path)


def group_spans_by_heading(doc: spacy.tokens.Doc) -> List[Dict]:
    """
    Group layout spans in the Doc by their inferred heading.

    Each group contains:
      - heading: normalized heading text
      - text: concatenated text of spans in reading order
      - span_count: how many spans
      - labels: list of the original layout labels
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

    grouped = []
    for head_text, spans in groups.items():
        spans_sorted = sorted(spans, key=lambda s: (s.start_char, s.end_char))
        text = "\n".join(s.text for s in spans_sorted if s.text and s.text.strip())
        grouped.append(
            {
                "heading": head_text,
                "text": text,
                "span_count": len(spans_sorted),
                "labels": [s.label_ for s in spans_sorted],
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
