"""
Section type classification using GLiNER.
Classifies resume section headings into types: contact, education, experience, skills, etc.
Merges heading groups by classified section type.
"""

from collections import defaultdict
from typing import Dict, List, Optional

from gliner import GLiNER

from api.pdf.config import GLINER_MODEL_NAME, SECTION_TYPE_LABELS, SECTION_MERGE_MAP
from api.pdf.models import HeadingGroup, TextGroup, TextSegment


# =============================================================================
# Lazy-loaded Singleton for GLiNER Model
# =============================================================================

_GLINER_MODEL: Optional[GLiNER] = None


def load_gliner_model() -> GLiNER:
    """
    Load the GLiNER model for section classification.
    Uses singleton pattern to avoid loading multiple times.
    
    Returns:
        GLiNER model instance
    """
    global _GLINER_MODEL
    if _GLINER_MODEL is None:
        print(f"[SectionClassifier] Loading GLiNER model: {GLINER_MODEL_NAME}...")
        _GLINER_MODEL = GLiNER.from_pretrained(GLINER_MODEL_NAME)
        print("[SectionClassifier] GLiNER model loaded successfully.")
    return _GLINER_MODEL


# =============================================================================
# Section Type Classification for Single Group
# =============================================================================

def classify_group_text(gliner: GLiNER, heading: str, text: str) -> Optional[str]:
    """
    Classify a group's text using GLiNER to identify section type.
    
    Uses the heading primarily (if available), with text as fallback.
    GLiNER predicts which section type labels match the content.
    
    Args:
        gliner: GLiNER model instance
        heading: The heading text of the group
        text: The full text content of the group
        
    Returns:
        Section type label (lowercase) or None if classification fails
    """
    # Prefer heading for classification (more indicative of section type)
    classification_text = heading if heading and heading != "NO_HEADING" else ""
    
    # Add some text content for context (first 200 chars)
    if text and text.strip():
        classification_text = f"{classification_text} {text.strip()[:200]}".strip()
    
    if not classification_text:
        return None
    
    try:
        # Use section type labels for entity extraction
        entities = gliner.predict_entities(
            classification_text,
            SECTION_TYPE_LABELS,
            threshold=0.3,  # Lower threshold for section classification
        )
    except Exception as e:
        print(f"[SectionClassifier] Error classifying text: {e}")
        return None
    
    if not entities:
        # Fallback: try keyword matching on heading
        return _keyword_fallback(heading)
    
    # Get the highest scoring entity
    best_entity = max(entities, key=lambda e: e.get("score", 0))
    label = best_entity.get("label", "").lower().strip()
    score = best_entity.get("score", 0)
    
    print(f"[SectionClassifier] Classified as '{label}' (score: {score:.3f})")
    
    return label


def _keyword_fallback(heading: str) -> Optional[str]:
    """
    Fallback classification using keyword matching on heading.
    
    Args:
        heading: The heading text
        
    Returns:
        Section type or None
    """
    if not heading:
        return None
    
    heading_lower = heading.lower()
    
    # Keyword mappings
    keywords = {
        "contact": ["contact", "email", "phone", "address", "personal"],
        "work experience": ["experience", "work", "employment", "career", "job"],
        "education": ["education", "academic", "school", "university", "degree"],
        "skills": ["skill", "competenc", "expertise", "technical", "proficienc"],
        "languages": ["language", "linguistic"],
        "projects": ["project", "portfolio"],
        "certifications": ["certif", "license", "credential", "accredit"],
        "extracurricular activities": ["extracurricular", "activit", "volunteer", "hobby", "interest"],
        "professional summary": ["summary", "objective", "profile", "about", "overview"],
    }
    
    for section_type, kw_list in keywords.items():
        for kw in kw_list:
            if kw in heading_lower:
                print(f"[SectionClassifier] Fallback matched '{section_type}' via keyword '{kw}'")
                return section_type
    
    return None


# =============================================================================
# Classify All Heading Groups
# =============================================================================

def classify_heading_groups(
    heading_groups: List[HeadingGroup],
) -> Dict[str, str]:
    """
    Classify each heading group using GLiNER.
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        Dict mapping heading text -> section type (e.g., "education", "work experience")
    """
    gliner = load_gliner_model()
    heading_to_section: Dict[str, str] = {}
    
    print(f"[SectionClassifier] Classifying {len(heading_groups)} heading groups...")
    
    for group in heading_groups:
        print(f"[SectionClassifier] Classifying '{group.heading}'...")
        section_type = classify_group_text(gliner, group.heading, group.text)
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
        # Normalize section type (e.g., "person" -> "contact", "job title" -> "work experience")
        normalized_type = SECTION_MERGE_MAP.get(section_type.lower(), section_type)
        section_to_groups[normalized_type].append(group)
    
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
            heading=section_type,  # Section label (e.g., "education", "work experience")
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
    1. Load GLiNER model
    2. Classify each heading group's text using GLiNER
    3. Merge groups with same section type
    
    Args:
        heading_groups: List of HeadingGroup from layout parser
        
    Returns:
        List of TextGroup objects, one per section type
        Each group's heading is the section label (e.g., "education", "work experience")
    """
    print("[SectionClassifier] Step 1: Classifying heading groups with GLiNER...")
    heading_to_section = classify_heading_groups(heading_groups)
    
    print("[SectionClassifier] Step 2: Merging groups by section type...")
    merged_groups = merge_groups_by_section(heading_groups, heading_to_section)
    
    return merged_groups
