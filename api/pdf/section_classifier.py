"""
Section classification using BERT fine-tuned on resume sections.
Classifies resume text into section types: education, experience, skills, etc.
"""

from collections import defaultdict
from typing import Dict, List, Optional, Tuple

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from api.pdf.config import SECTION_CLASSIFIER_MODEL, SECTION_MERGE_MAP
from api.pdf.models import HeadingGroup, TextGroup, TextSegment


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
            predicted_class = torch.argmax(logits, dim=-1).item()
        
        # Get label from model config
        label = model.config.id2label.get(predicted_class, "unknown")
        return label.lower()
        
    except Exception as e:
        print(f"[SectionClassifier] Error classifying: {e}")
        return None


def classify_heading_groups(heading_groups: List[HeadingGroup]) -> Dict[str, str]:
    """
    Classify each heading group using BERT.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        Dict mapping heading text -> section type
    """
    model, tokenizer = load_section_classifier()
    heading_to_section: Dict[str, str] = {}
    
    print(f"[SectionClassifier] Classifying {len(heading_groups)} heading groups...")
    
    for group in heading_groups:
        # Use heading + first part of text for classification
        classification_text = group.heading if group.heading != "NO_HEADING" else ""
        if group.text:
            classification_text = f"{classification_text} {group.text[:300]}".strip()
        
        section_type = classify_text(model, tokenizer, classification_text)
        heading_to_section[group.heading] = section_type or "unknown"
        print(f"[SectionClassifier] '{group.heading}' -> {heading_to_section[group.heading]}")
    
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
