"""
PDF layout parsing using spaCy-Layout.
Extracts text spans with headings and coordinates.
Groups text by heading, classifies headings with GLiNER, then merges by section type.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional

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
# Raw Heading Group (Internal)
# =============================================================================

class _RawHeadingGroup:
    """Internal class for grouping text by raw heading before classification."""
    def __init__(self, heading: str):
        self.heading = heading  # Original heading text
        self.text_parts: List[str] = []
        self.segments: List[TextSegment] = []
    
    def add_segment(self, text: str, label: str, bbox: Optional[BoundingBox]):
        """Add a text segment to this group."""
        self.text_parts.append(text)
        self.segments.append(TextSegment(text=text, label=label, bbox=bbox))


# =============================================================================
# Step 1: Group Spans by Heading
# =============================================================================

def group_spans_by_heading(doc: spacy.tokens.Doc) -> Dict[str, _RawHeadingGroup]:
    """
    Group layout spans by their heading.
    
    Args:
        doc: spaCy Doc with layout spans
        
    Returns:
        Dict mapping heading text -> _RawHeadingGroup
    """
    groups: Dict[str, _RawHeadingGroup] = {}
    
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
            groups[head_text] = _RawHeadingGroup(head_text)
        
        # Get span text and bbox
        span_text = (span.text or "").strip()
        if not span_text:
            continue
        
        layout_obj = getattr(span._, "layout", None)
        bbox = extract_bbox(layout_obj)
        
        groups[head_text].add_segment(span_text, span.label_, bbox)
    
    return groups


# =============================================================================
# Step 2: Classify Headings with GLiNER
# =============================================================================

def classify_headings(
    groups: Dict[str, _RawHeadingGroup],
    gliner,
) -> Dict[str, str]:
    """
    Classify each heading using GLiNER and return heading -> section_type mapping.
    
    Args:
        groups: Dict of heading -> _RawHeadingGroup
        gliner: GLiNER model instance
        
    Returns:
        Dict mapping heading text -> section type (e.g., "education", "experience")
    """
    from api.pdf.section_classifier import classify_heading
    
    heading_to_section: Dict[str, str] = {}
    
    for heading in groups.keys():
        if heading == "NO_HEADING":
            # Try to classify NO_HEADING based on first few lines of content
            content = " ".join(groups[heading].text_parts[:3])[:200]
            section_type = classify_heading(gliner, content)
            heading_to_section[heading] = section_type or "unknown"
        else:
            section_type = classify_heading(gliner, heading)
            heading_to_section[heading] = section_type or "unknown"
    
    return heading_to_section


# =============================================================================
# Step 3: Merge Groups by Section Type
# =============================================================================

def merge_groups_by_section(
    raw_groups: Dict[str, _RawHeadingGroup],
    heading_to_section: Dict[str, str],
) -> List[TextGroup]:
    """
    Merge groups that have the same section type.
    The merged group's heading becomes the section type label.
    
    Args:
        raw_groups: Dict of heading -> _RawHeadingGroup
        heading_to_section: Dict of heading -> section type
        
    Returns:
        List of merged TextGroup objects with section label as heading
    """
    # Group raw groups by their section type
    section_to_raw_groups: Dict[str, List[_RawHeadingGroup]] = defaultdict(list)
    
    for heading, raw_group in raw_groups.items():
        section_type = heading_to_section.get(heading, "unknown")
        section_to_raw_groups[section_type].append(raw_group)
    
    # Build merged TextGroups
    merged_groups: List[TextGroup] = []
    
    for section_type, raw_group_list in section_to_raw_groups.items():
        # Combine all text and segments from groups of the same section type
        combined_text_parts: List[str] = []
        combined_segments: List[TextSegment] = []
        
        for raw_group in raw_group_list:
            # Add the original heading as part of the text (for context)
            if raw_group.heading != "NO_HEADING":
                combined_text_parts.append(raw_group.heading)
            
            # Add all text parts
            combined_text_parts.extend(raw_group.text_parts)
            
            # Add all segments (preserves coordinates)
            combined_segments.extend(raw_group.segments)
        
        # Create merged TextGroup with section type as heading
        merged_group = TextGroup(
            heading=section_type,  # Section label (e.g., "education", "experience")
            text=" ".join(combined_text_parts),
            segments=combined_segments,
            entities=[],
        )
        
        merged_groups.append(merged_group)
    
    # Log merge results
    print(f"[Layout] Merged into {len(merged_groups)} section groups:")
    for group in merged_groups:
        print(f"[Layout]   {group.heading}: {len(group.segments)} segments, {len(group.text)} chars")
    
    return merged_groups


# =============================================================================
# Main Function: Parse and Group by Section
# =============================================================================

def parse_and_group_by_section(
    doc: spacy.tokens.Doc,
    gliner,
) -> List[TextGroup]:
    """
    Main function to parse PDF and group text by classified section type.
    
    Pipeline:
    1. Group spans by their raw heading
    2. Classify each heading using GLiNER
    3. Merge groups with same section type
    
    Args:
        doc: spaCy Doc with layout spans
        gliner: GLiNER model instance
        
    Returns:
        List of TextGroup objects, one per section type
        Each group's heading is the section label (e.g., "education", "experience")
    """
    print("[Layout] Step 1: Grouping spans by heading...")
    raw_groups = group_spans_by_heading(doc)
    print(f"[Layout] Found {len(raw_groups)} raw heading groups:")
    for heading, group in raw_groups.items():
        print(f"[Layout]   '{heading}': {len(group.segments)} segments")
    
    print("[Layout] Step 2: Classifying headings with GLiNER...")
    heading_to_section = classify_headings(raw_groups, gliner)
    for heading, section in heading_to_section.items():
        print(f"[Layout]   '{heading}' -> {section}")
    
    print("[Layout] Step 3: Merging groups by section type...")
    merged_groups = merge_groups_by_section(raw_groups, heading_to_section)
    
    return merged_groups


# =============================================================================
# Utility Functions
# =============================================================================

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
