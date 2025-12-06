"""
Section classification using BERT fine-tuned on resume sections.
Classifies resume text into section types: education, experience, skills, etc.
"""

from collections import defaultdict
from typing import Dict, List, Optional, Tuple

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from api.pdf.config import COMMON_SECTION_HEADERS, SECTION_CLASSIFIER_MODEL, SECTION_MERGE_MAP
from api.pdf.models import HeadingGroup, TextGroup, TextSegment


# =============================================================================
# Optimization: Pre-compute Lookup Map
# =============================================================================

# Flatten the config dict (Type -> [Headers]) into a lookup map (Header -> Type)
# This ensures O(1) lookup speed in match_common_header
_HEADER_LOOKUP: Dict[str, str] = {
    header: section_type
    for section_type, headers in COMMON_SECTION_HEADERS.items()
    for header in headers
}


# =============================================================================
# Model Singleton
# =============================================================================

_MODEL = None
_TOKENIZER = None


def load_section_classifier() -> Tuple[AutoModelForSequenceClassification, AutoTokenizer]:
    """
    Load the BERT model for section classification.
    Uses singleton pattern to avoid reloading.
    """
    global _MODEL, _TOKENIZER
    
    if _MODEL is None or _TOKENIZER is None:
        print(f"[SectionClassifier] Loading BERT model: {SECTION_CLASSIFIER_MODEL}...")
        _TOKENIZER = AutoTokenizer.from_pretrained(SECTION_CLASSIFIER_MODEL)
        _MODEL = AutoModelForSequenceClassification.from_pretrained(SECTION_CLASSIFIER_MODEL)
        _MODEL.eval()
        print("[SectionClassifier] BERT model loaded successfully.")
    
    return _MODEL, _TOKENIZER


# =============================================================================
# Fast-path Header Matching
# =============================================================================

def match_common_header(heading: str) -> Optional[str]:
    """
    Try to match heading against common resume section headers.
    This is a fast-path to avoid expensive BERT classification.
    
    Args:
        heading: The heading text to match
        
    Returns:
        Section type if matched, None otherwise
    """
    if not heading or heading == "NO_HEADING":
        return None
    
    # Normalize heading: lowercase, strip whitespace and common punctuation
    normalized = heading.lower().strip()
    normalized = normalized.rstrip(':').strip()
    
    # Direct lookup using the pre-computed map
    if normalized in _HEADER_LOOKUP:
        return _HEADER_LOOKUP[normalized]
    
    # Try without special characters (e.g., "Work Experience:" -> "work experience")
    cleaned = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in normalized)
    cleaned = ' '.join(cleaned.split())  # Normalize whitespace
    
    if cleaned in _HEADER_LOOKUP:
        return _HEADER_LOOKUP[cleaned]
    
    return None


# =============================================================================
# Classification
# =============================================================================

def classify_text(model, tokenizer, text: str) -> Optional[str]:
    """
    Classify text into a section type using BERT.
    
    Args:
        model: BERT model instance
        tokenizer: BERT tokenizer instance
        text: Text to classify
        
    Returns:
        Section type label (lowercase) or None
    """
    if not text or not text.strip():
        return None
    
    # Truncate long text
    text = text.strip()[:512]
    
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            # Sort class indices by logits (descending)
            sorted_indices = torch.argsort(logits, dim=-1, descending=True).squeeze().tolist()
        
        # Find the best label that is not excluded
        for class_idx in sorted_indices:
            label = model.config.id2label.get(class_idx, "unknown").lower()
            if label not in {"para"}:
                return label
        
        return "unknown"
        
    except Exception as e:
        print(f"[SectionClassifier] Error classifying: {e}")
        return None


def classify_heading_groups(heading_groups: List[HeadingGroup]) -> Dict[str, str]:
    """
    Classify each heading group, using fast header matching first then BERT as fallback.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        Dict mapping heading text -> section type
    """
    heading_to_section: Dict[str, str] = {}
    groups_needing_bert: List[HeadingGroup] = []
    
    print(f"[SectionClassifier] Classifying {len(heading_groups)} heading groups...")
    
    # First pass: Try fast-path header matching
    for group in heading_groups:
        # Auto-assign NO_HEADING as contact section (typically contains name/email/phone at top)
        if group.heading == "NO_HEADING":
            heading_to_section[group.heading] = "contact"
            print(f"[SectionClassifier] '{group.heading}' -> contact (auto-assigned)")
            continue
        
        # Try fast-path matching against common headers
        matched_section = match_common_header(group.heading)
        if matched_section:
            heading_to_section[group.heading] = matched_section
            print(f"[SectionClassifier] '{group.heading}' -> {matched_section} (fast-match)")
            continue
        
        # Queue for BERT classification
        groups_needing_bert.append(group)
    
    # Second pass: Use BERT only for unmatched headings
    if groups_needing_bert:
        print(f"[SectionClassifier] {len(groups_needing_bert)} headings need BERT classification...")
        model, tokenizer = load_section_classifier()
        
        for group in groups_needing_bert:
            # Use heading + first part of text for classification
            classification_text = group.heading
            if group.text:
                classification_text = f"{classification_text} {group.text[:300]}".strip()
            
            section_type = classify_text(model, tokenizer, classification_text)
            heading_to_section[group.heading] = section_type or "unknown"
            print(f"[SectionClassifier] '{group.heading}' -> {heading_to_section[group.heading]} (BERT)")
    else:
        print("[SectionClassifier] All headings matched via fast-path, BERT not needed!")
    
    return heading_to_section


# =============================================================================
# Merge Groups by Section Type
# =============================================================================

def merge_groups_by_section(
    heading_groups: List[HeadingGroup],
    heading_to_section: Dict[str, str],
) -> List[TextGroup]:
    """
    Merge heading groups that have the same section type.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        heading_to_section: Dict of heading -> section type
        
    Returns:
        List of merged TextGroup objects
    """
    section_to_groups: Dict[str, List[HeadingGroup]] = defaultdict(list)
    
    for group in heading_groups:
        section_type = heading_to_section.get(group.heading, "unknown")
        # Normalize to canonical names
        normalized = SECTION_MERGE_MAP.get(section_type, section_type)
        section_to_groups[normalized].append(group)
    
    merged_groups: List[TextGroup] = []
    
    for section_type, groups in section_to_groups.items():
        combined_text_parts: List[str] = []
        combined_segments: List[TextSegment] = []
        
        for group in groups:
            if group.heading != "NO_HEADING":
                combined_text_parts.append(group.heading)
            
            for segment in group.segments:
                combined_text_parts.append(segment.text)
            
            combined_segments.extend(group.segments)
        
        merged_group = TextGroup(
            heading=section_type,
            text=" ".join(combined_text_parts),
            segments=combined_segments,
            entities=[],
        )
        merged_groups.append(merged_group)
    
    print(f"[SectionClassifier] Merged into {len(merged_groups)} section groups:")
    for group in merged_groups:
        print(f"[SectionClassifier]   {group.heading}: {len(group.segments)} segments")
    
    return merged_groups


# =============================================================================
# Main Function
# =============================================================================

def classify_and_merge_sections(heading_groups: List[HeadingGroup]) -> List[TextGroup]:
    """
    Classify heading groups and merge by section type.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        List of TextGroup objects, one per section type
    """
    print("[SectionClassifier] Step 1: Classifying with BERT...")
    heading_to_section = classify_heading_groups(heading_groups)
    
    print("[SectionClassifier] Step 2: Merging by section type...")
    merged_groups = merge_groups_by_section(heading_groups, heading_to_section)
    
    return merged_groups