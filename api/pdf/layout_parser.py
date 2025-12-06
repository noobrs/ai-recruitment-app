"""
PDF layout parsing using spaCy-Layout.
Extracts text spans with headings and coordinates.
Groups text by heading - outputs string with heading + text for classification.
Preserves original segments with coordinates.
"""

from typing import Any, Dict, List, Optional

import spacy
from spacy_layout import spaCyLayout

from api.pdf.config import SKIP_SPAN_LABELS
from api.pdf.models import BoundingBox, HeadingGroup, TextSegment


# =============================================================================
# Lazy-loaded Singletons
# =============================================================================

_NLP = None
_LAYOUT: Optional[spaCyLayout] = None


def get_layout_parser() -> spaCyLayout:
    """Get or create the spaCy-Layout parser instance."""
    global _NLP, _LAYOUT
    if _LAYOUT is None:
        _NLP = spacy.blank("en")
        _LAYOUT = spaCyLayout(_NLP)
    return _LAYOUT


# =============================================================================
# PDF Loading
# =============================================================================

def load_pdf_first_page(pdf_path: str) -> spacy.tokens.Doc:
    """
    Parse only the first page of a PDF file.
    Uses spaCy-Layout which processes all pages, but we filter to first page.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        spaCy Doc with layout spans (filtered to first page only)
    """
    parser = get_layout_parser()
    doc = parser(pdf_path)
    
    # Filter spans to only include first page (page_number = 1)
    first_page_spans = []
    for span in doc.spans.get("layout", []):
        layout_obj = getattr(span._, "layout", None)
        if layout_obj is not None:
            page_num = getattr(layout_obj, "page_number", 1)
            if page_num == 1:
                first_page_spans.append(span)
        else:
            # If no layout info, include by default
            first_page_spans.append(span)
    
    # Update the doc's spans (create a new span group)
    doc.spans["layout"] = first_page_spans
    return doc


# =============================================================================
# Coordinate Extraction
# =============================================================================

def extract_bbox(layout_obj: Any) -> Optional[BoundingBox]:
    """
    Extract bounding box coordinates from a layout object.
    
    Args:
        layout_obj: Layout object from spaCy-Layout
        
    Returns:
        BoundingBox object or None if not available
    """
    if layout_obj is None:
        return None

    # Try primary approach: x, y, width, height attributes
    x = getattr(layout_obj, "x", None)
    y = getattr(layout_obj, "y", None)
    width = getattr(layout_obj, "width", None)
    height = getattr(layout_obj, "height", None)

    if all(v is not None for v in [x, y, width, height]):
        return BoundingBox(
            page_index=0,
            x0=float(x),
            y0=float(y),
            x1=float(x + width),
            y1=float(y + height),
        )

    return None


# =============================================================================
# Text Normalization
# =============================================================================

def normalize_text(text: Optional[str]) -> str:
    """Normalize text by stripping whitespace and collapsing spaces."""
    if not text:
        return ""
    return " ".join(text.strip().split())


# =============================================================================
# Main Function: Group Spans by Heading
# =============================================================================

def group_spans_by_heading(doc: spacy.tokens.Doc) -> List[HeadingGroup]:
    """
    Group layout spans by their heading.
    
    Each group contains:
    - heading: Original heading text (or "NO_HEADING")
    - text: String starting with heading, then the content (for classification)
    - segments: List of TextSegment with original coordinates (preserved)
    
    Args:
        doc: spaCy Doc with layout spans
        
    Returns:
        List of HeadingGroup objects
    """
    groups: Dict[str, HeadingGroup] = {}
    
    for span in doc.spans.get("layout", []):
        if span.label_ in SKIP_SPAN_LABELS:
            continue
        
        # Get heading for this span
        head_span = getattr(span._, "heading", None)
        head_text = normalize_text(head_span.text if head_span is not None else None)
        
        if not head_text:
            head_text = "NO_HEADING"
        
        # Create group if not exists
        if head_text not in groups:
            groups[head_text] = HeadingGroup(
                heading=head_text,
                text="",  # Will be built later
                segments=[],
            )
        
        # Get span text and bbox
        span_text = (span.text or "").strip()
        if not span_text:
            continue
        
        layout_obj = getattr(span._, "layout", None)
        bbox = extract_bbox(layout_obj)
        
        # Add segment with coordinates
        groups[head_text].segments.append(
            TextSegment(text=span_text, label=span.label_, bbox=bbox)
        )
    
    # Build text field for each group: "heading\ntext content..."
    result: List[HeadingGroup] = []
    for heading, group in groups.items():
        text_parts = []
        
        # Start with heading (if not NO_HEADING)
        if heading != "NO_HEADING":
            text_parts.append(heading)
        
        # Add all segment texts
        for segment in group.segments:
            text_parts.append(segment.text)
        
        group.text = "\n".join(text_parts)
        result.append(group)
    
    # Log results
    print(f"[Layout] Grouped spans into {len(result)} heading groups:")
    for group in result:
        print(f"[Layout]   '{group.heading}': {len(group.segments)} segments, {len(group.text)} chars")
    
    return result
