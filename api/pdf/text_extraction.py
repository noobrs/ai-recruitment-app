from __future__ import annotations
from collections import defaultdict
from typing import List
from pathlib import Path

import spacy
from spacy.tokens import Doc
from spacy_layout import spaCyLayout

from .config import SKIP_SPAN_LABELS
from .types import GroupBlock
from .utils import normalize_heading

# Lazy singletons
_NLP = None
_LAYOUT: spaCyLayout | None = None

def _get_layout() -> spaCyLayout:
    global _NLP, _LAYOUT
    if _LAYOUT is None:
        _NLP = spacy.blank("en")
        _LAYOUT = spaCyLayout(_NLP)
    return _LAYOUT

def load_doc_with_layout(pdf_path: Path) -> Doc:
    layout = _get_layout()
    return layout(str(pdf_path))

def group_spans_by_heading(doc: Doc) -> List[GroupBlock]:
    groups = defaultdict(list)
    spans = doc.spans.get("layout", [])  # safety
    for span in spans:
        if getattr(span, "label_", "") in SKIP_SPAN_LABELS:
            continue
        head_span = getattr(span._, "heading", None)
        head_text = normalize_heading(head_span.text if head_span is not None else None)
        groups[head_text].append(span)

    grouped: List[GroupBlock] = []
    for head_text, spans_ in groups.items():
        spans_sorted = sorted(spans_, key=lambda s: (s.start_char, s.end_char))
        text = "\n".join(s.text for s in spans_sorted if (s.text or "").strip())
        grouped.append(GroupBlock(
            heading=head_text,
            text=text,
            span_count=len(spans_sorted),
            labels=[getattr(s, "label_", "") for s in spans_sorted],
        ))

    # Prefer title/summary-ish groups first as a heuristic
    grouped.sort(key=lambda g: (0 if g.heading.lower().startswith(("title", "summary")) else 1,
                                len(g.text)))
    return grouped
