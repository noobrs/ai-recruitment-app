"""
PDF layout parsing using spaCy-Layout.
Extracts text spans with headings and coordinates.
Groups text by heading with proper handling of NO_HEADING.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Set

import spacy
from spacy_layout import spaCyLayout

from api.pdf.config import SKIP_SPAN_LABELS
from api.pdf.models import BoundingBox, TextGroup, TextSegment


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

def load_pdf_with_layout(pdf_path: str) -> spacy.tokens.Doc:
    """
    Parse a PDF file and return a spaCy Doc with layout information.
    The Doc will have spans available at doc.spans["layout"].
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        spaCy Doc with layout spans
    """
    parser = get_layout_parser()
    return parser(pdf_path)


def load_pdf_first_page(pdf_path: str) -> spacy.tokens.Doc:
    """
    Parse only the first page of a PDF file.
    Uses spaCy-Layout which processes all pages, but we filter to first page.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        spaCy Doc with layout spans (filtered to first page only)
    """
    doc = load_pdf_with_layout(pdf_path)
    
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

    # Extract page number (1-indexed in spaCy-Layout)
    page_num = getattr(layout_obj, "page_number", None)
    if page_num is None:
        page_num = getattr(layout_obj, "page", None)
    if page_num is None:
        page_index = 0
    else:
        page_index = max(0, int(page_num) - 1)

    # Try primary approach: x, y, width, height attributes
    x = getattr(layout_obj, "x", None)
    y = getattr(layout_obj, "y", None)
    width = getattr(layout_obj, "width", None)
    height = getattr(layout_obj, "height", None)

    if all(v is not None for v in [x, y, width, height]):
        return BoundingBox(
            page_index=page_index,
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
# Heading Grouping
# =============================================================================

def group_spans_by_heading(doc: spacy.tokens.Doc) -> List[TextGroup]:
    """
    Group layout spans by their heading and preserve coordinates.
    
    Features:
    1. Groups text under their respective headings
    2. Creates NO_HEADING group for orphaned text
    3. Removes heading text from NO_HEADING to avoid duplication
    4. Includes heading text in each group's text content
    5. Preserves bounding box coordinates for each segment
    
    Args:
        doc: spaCy Doc with layout spans
        
    Returns:
        List of TextGroup objects, each containing:
        - heading: heading text or 'NO_HEADING'
        - text: concatenated text content (includes heading)
        - segments: list of TextSegment with bbox coordinates
        - section_type: None (to be classified later)
        - entities: empty list (to be extracted later)
    """
    # Collect spans by heading
    groups_dict: Dict[str, List[Any]] = defaultdict(list)
    
    for span in doc.spans.get("layout", []):
        if span.label_ in SKIP_SPAN_LABELS:
            continue
        
        # Get heading for this span
        head_span = getattr(span._, "heading", None)
        head_text = normalize_text(head_span.text if head_span is not None else None)
        
        if not head_text:
            head_text = "NO_HEADING"
        
        groups_dict[head_text].append(span)
    
    # Collect all heading texts (excluding NO_HEADING) for deduplication
    heading_texts: Set[str] = set()
    for head_text in groups_dict.keys():
        if head_text != "NO_HEADING":
            heading_texts.add(head_text.lower().strip())
    
    # Build TextGroup objects
    result: List[TextGroup] = []
    
    for head_text, spans in groups_dict.items():
        # Sort spans by position in document
        spans_sorted = sorted(spans, key=lambda s: (s.start_char, s.end_char))
        
        text_lines = []
        segments = []
        
        # If this is a proper heading (not NO_HEADING), include heading as first line
        if head_text != "NO_HEADING":
            text_lines.append(head_text)
        
        for span in spans_sorted:
            span_text = (span.text or "").strip()
            if not span_text:
                continue
            
            normalized_span_text = normalize_text(span_text)
            
            # For NO_HEADING group, skip text that matches a heading elsewhere
            if head_text == "NO_HEADING":
                if normalized_span_text.lower() in heading_texts:
                    continue
                # Also check if first line of multi-line text matches a heading
                first_line = span_text.split("\n")[0].strip().lower()
                if first_line and first_line in heading_texts:
                    continue
            
            text_lines.append(span_text)
            
            # Extract coordinates
            layout_obj = getattr(span._, "layout", None)
            bbox = extract_bbox(layout_obj)
            
            segments.append(TextSegment(
                text=span_text,
                label=span.label_,
                bbox=bbox,
            ))
        
        # Skip empty groups
        if not segments and head_text == "NO_HEADING":
            continue
        
        group_text = "\n".join(text_lines)
        
        result.append(TextGroup(
            heading=head_text,
            text=group_text,
            segments=segments,
            section_type=None,
            entities=[],
        ))
    
    # Sort by text length (longer sections tend to be more important)
    result.sort(key=lambda g: -len(g.text))
    
    return result


def filter_no_heading_duplicates(groups: List[TextGroup]) -> List[TextGroup]:
    """
    Additional filtering to remove NO_HEADING groups whose content
    substantially overlaps with other heading groups.
    
    This is a secondary pass after the initial grouping to catch
    any remaining duplicates.
    
    Args:
        groups: List of TextGroup objects
        
    Returns:
        Filtered list with duplicate NO_HEADING content removed
    """
    # Collect all non-NO_HEADING text content
    heading_content: Set[str] = set()
    for group in groups:
        if group.heading != "NO_HEADING":
            # Add heading
            heading_content.add(group.heading.lower().strip())
            # Add first lines of segments
            for segment in group.segments:
                first_line = segment.text.split("\n")[0].strip().lower()
                if first_line:
                    heading_content.add(first_line)
    
    # Filter NO_HEADING groups
    filtered = []
    for group in groups:
        if group.heading == "NO_HEADING":
            # Check if this NO_HEADING group's content is mostly headings
            remaining_segments = []
            for segment in group.segments:
                text_lower = segment.text.strip().lower()
                first_line = text_lower.split("\n")[0].strip()
                
                # Keep segment if it's not just a heading
                if text_lower not in heading_content and first_line not in heading_content:
                    remaining_segments.append(segment)
            
            if remaining_segments:
                # Rebuild the group with filtered segments
                new_text = "\n".join(s.text for s in remaining_segments)
                filtered.append(TextGroup(
                    heading="NO_HEADING",
                    text=new_text,
                    segments=remaining_segments,
                    section_type=group.section_type,
                    entities=group.entities,
                ))
        else:
            filtered.append(group)
    
    return filtered


def get_document_text(doc: spacy.tokens.Doc) -> str:
    """Extract full text from document."""
    return doc.text or ""


def get_first_page_text(doc: spacy.tokens.Doc) -> str:
    """Extract text from first page only."""
    texts = []
    for span in doc.spans.get("layout", []):
        layout_obj = getattr(span._, "layout", None)
        if layout_obj is not None:
            page_num = getattr(layout_obj, "page_number", 1)
            if page_num == 1:
                texts.append(span.text or "")
        else:
            texts.append(span.text or "")
    return "\n".join(texts)

