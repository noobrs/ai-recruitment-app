"""
Section type classification using facebook/bart-large-mnli (zero-shot classification).
Classifies resume section headings into types: person, education, experience, skills, etc.
Merges heading groups by classified section type.
"""

from collections import defaultdict
from typing import Dict, List, Optional

from transformers import pipeline

from api.pdf.config import SECTION_CLASSIFIER_MODEL_NAME, SECTION_TYPE_LABELS
from api.pdf.models import HeadingGroup, TextGroup, TextSegment


# =============================================================================
# Lazy-loaded Singleton for Classifier
# =============================================================================

_CLASSIFIER = None


def load_section_classifier():
    """
    Load the zero-shot classification model for section classification.
    Uses facebook/bart-large-mnli for better semantic understanding.
    
    Returns:
        Hugging Face zero-shot-classification pipeline
    """
    global _CLASSIFIER
    if _CLASSIFIER is None:
        print(f"[SectionClassifier] Loading model: {SECTION_CLASSIFIER_MODEL_NAME}...")
        _CLASSIFIER = pipeline(
            "zero-shot-classification",
            model=SECTION_CLASSIFIER_MODEL_NAME,
            device=-1,  # CPU, use 0 for GPU
        )
        print("[SectionClassifier] Model loaded successfully.")
    return _CLASSIFIER


# =============================================================================
# Section Type Classification for Single Group
# =============================================================================

def classify_group_text(classifier, text: str) -> Optional[str]:
    """
    Classify a group's text using zero-shot classification (BART-large-MNLI).
    
    Uses the BART model to understand the semantic meaning of the text
    and map it to a standard section type.
    
    Args:
        classifier: Hugging Face zero-shot-classification pipeline
        text: Group text (heading + content) to classify
        
    Returns:
        Section type string (lowercase) or None if classification fails.
        Possible values: "personally identifiable information", "education", 
                        "experience", "skills", "certifications", "activities", "summary"
    """
    if not text or not text.strip():
        return None
    
    # Use first 500 chars for classification (enough context, not too slow)
    text_for_classification = text.strip()[:500]
    
    # Use zero-shot classification
    try:
        result = classifier(
            text_for_classification,
            candidate_labels=SECTION_TYPE_LABELS,
            hypothesis_template="This is the {} section of a professional résumé.",
        )
    except Exception as e:
        print(f"[SectionClassifier] Error classifying text: {e}")
        return None
    
    if not result or "labels" not in result or "scores" not in result:
        return None
    
    # Get the highest scoring label
    best_label = result["labels"][0]
    best_score = result["scores"][0]
    
    # Normalize label to lowercase
    label = best_label.lower().strip()
    
    print(f"[SectionClassifier] Classified as '{label}' (score: {best_score:.3f})")
    
    return label


# =============================================================================
# Classify All Heading Groups
# =============================================================================

def classify_heading_groups(
    heading_groups: List[HeadingGroup],
) -> Dict[str, str]:
    """
    Classify each heading group using BART-large-MNLI (zero-shot classification).
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        Dict mapping heading text -> section type (e.g., "education", "experience")
    """
    classifier = load_section_classifier()
    heading_to_section: Dict[str, str] = {}
    
    print(f"[SectionClassifier] Classifying {len(heading_groups)} heading groups...")
    
    for group in heading_groups:
        print(f"[SectionClassifier] Classifying '{group.heading}'...")
        section_type = classify_group_text(classifier, group.text)
        heading_to_section[group.heading] = section_type or "unknown"
        print(f"[SectionClassifier]   '{group.heading}' -> {heading_to_section[group.heading]}")
    
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
    The merged group's heading becomes the section type label.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        heading_to_section: Dict of heading -> section type
        
    Returns:
        List of merged TextGroup objects with section label as heading
    """
    # Group by section type
    section_to_groups: Dict[str, List[HeadingGroup]] = defaultdict(list)
    
    for group in heading_groups:
        section_type = heading_to_section.get(group.heading, "unknown")
        section_to_groups[section_type].append(group)
    
    # Build merged TextGroups
    merged_groups: List[TextGroup] = []
    
    for section_type, groups in section_to_groups.items():
        # Combine all text and segments from groups of the same section type
        combined_text_parts: List[str] = []
        combined_segments: List[TextSegment] = []
        
        for group in groups:
            # Add the original heading as part of the text (for context)
            if group.heading != "NO_HEADING":
                combined_text_parts.append(group.heading)
            
            # Add all segment texts
            for segment in group.segments:
                combined_text_parts.append(segment.text)
            
            # Add all segments (preserves coordinates)
            combined_segments.extend(group.segments)
        
        # Create merged TextGroup with section type as heading
        merged_group = TextGroup(
            heading=section_type,  # Section label (e.g., "education", "experience")
            text=" ".join(combined_text_parts),
            segments=combined_segments,
            entities=[],
        )
        
        merged_groups.append(merged_group)
    
    # Log merge results
    print(f"[SectionClassifier] Merged into {len(merged_groups)} section groups:")
    for group in merged_groups:
        print(f"[SectionClassifier]   {group.heading}: {len(group.segments)} segments, {len(group.text)} chars")
    
    return merged_groups


# =============================================================================
# Main Function: Classify and Merge
# =============================================================================

def classify_and_merge_sections(
    heading_groups: List[HeadingGroup],
) -> List[TextGroup]:
    """
    Main function to classify heading groups and merge by section type.
    
    Pipeline:
    1. Load BART-large-MNLI classifier
    2. Classify each heading group's text
    3. Merge groups with same section type
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        List of TextGroup objects, one per section type
        Each group's heading is the section label (e.g., "education", "experience")
    """
    print("[SectionClassifier] Step 1: Classifying heading groups...")
    heading_to_section = classify_heading_groups(heading_groups)
    
    print("[SectionClassifier] Step 2: Merging groups by section type...")
    merged_groups = merge_groups_by_section(heading_groups, heading_to_section)
    
    return merged_groups
