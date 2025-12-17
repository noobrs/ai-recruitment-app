from typing import Set, Tuple, List, Optional

import spacy
from spacy_layout import spaCyLayout
from spacy_layout.types import SpanLayout
from api.types.types import TextSpan, TextGroup


# =============================================================================
# Lazy-loaded Singletons
# =============================================================================

nlp = None
parser = None


def get_layout_parser():
    """Get or create the spaCy-Layout parser instance."""
    global nlp, parser
    if parser is None:
        nlp = spacy.blank("en")
        parser = spaCyLayout(nlp)
    return parser


# =============================================================================
# Helper
# =============================================================================

def extract_bbox(layout_obj: SpanLayout) -> Optional[Tuple[float, float, float, float]]:
    if layout_obj is None:
        return None

    return (
        layout_obj.x, 
        layout_obj.y, 
        layout_obj.x + layout_obj.width, 
        layout_obj.y + layout_obj.height
        )


# =============================================================================
# Load PDF
# =============================================================================

def load_pdf(pdf_path: str) -> spacy.tokens.Doc:
    parser = get_layout_parser()
    doc = parser(pdf_path)

    return doc


# =============================================================================
# Preprocess PDF
# =============================================================================

def preprocess_layout_doc(doc: spacy.tokens.Doc) -> List[TextSpan]:
    
    # 1) Filter out non-first-page spans
    raw_kept_spans = [
        s for s in doc.spans["layout"]
        if s._.layout.page_no == 1
    ]

    # 2) Collect headings that already exist on remaining spans
    real_headings: Set[str] = set()
    for span in raw_kept_spans:
        heading_val = span._.heading
        if heading_val is not None:
            heading_str = str(heading_val)
            if heading_str:
                real_headings.add(heading_str)

    # 3) Create TextSpan objects (Fixing empty headings if text matches a real heading)
    results: List[TextSpan] = []
    
    for span in raw_kept_spans:
        # Determine the current heading string safely
        current_heading_val = span._.heading
        final_heading_str = str(current_heading_val) if current_heading_val is not None else ""

        # Logic: If this span has no heading, but its text appears as a heading elsewhere, promote it
        if not final_heading_str:
            if span.text in real_headings:
                final_heading_str = span.text
            else:
                final_heading_str = "NO_HEADING"

        # Explicitly create the TextSpan
        layout_span = TextSpan(
            text=span.text,
            label=span.label_,
            heading=final_heading_str,
            bbox=extract_bbox(span._.layout)
        )
        results.append(layout_span)

    return results


# =============================================================================
# Sequentially Group Spans by Heading (Initial TextGroups)
# =============================================================================

def group_spans_by_heading(spans: List[TextSpan]) -> List[TextGroup]:
    if not spans:
        return []

    grouped_list: List[TextGroup] = []
    
    # Initialize the first group
    current_group = TextGroup(
        heading=spans[0].heading,
        text="",
        spans=[]
    )
    
    for span in spans:
        # If the heading changes, we close the current group and start a new one
        if span.heading != current_group.heading:
            # 1. Save the finished group
            grouped_list.append(current_group)
            
            # 2. Start a new group
            current_group = TextGroup(
                heading=span.heading,
                text="",
                spans=[]
            )
        
        # Add span to the current active group
        current_group.spans.append(span)
        current_group.text += (span.text + " ")

    # Don't forget to append the final group after the loop finishes
    grouped_list.append(current_group)

    return grouped_list