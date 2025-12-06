"""
Section type classification using GLiNER.
Classifies resume sections into types: person, education, experience, skills, etc.
"""

from typing import List, Optional

from gliner import GLiNER

from api.pdf_new.config import SECTION_TYPE_LABELS, SECTION_TYPE_THRESHOLD
from api.pdf_new.models import TextGroup


# =============================================================================
# Section Type Classification
# =============================================================================

def classify_section_type(
    gliner: GLiNER,
    heading: str,
    text: str,
) -> Optional[str]:
    """
    Classify the type of a resume section using GLiNER.
    
    Uses the GLiNER model to understand the semantic meaning of the section
    based on both the heading and content.
    
    Args:
        gliner: GLiNER model instance
        heading: Section heading text
        text: Section body text (used as context)
        
    Returns:
        Section type string (lowercase) or None if classification fails.
        Possible values: "person", "education", "experience", "skills",
                        "certifications", "projects", "activities", "summary"
    """
    # Prepare text for classification
    if heading and heading != "NO_HEADING":
        # Prioritize heading, add context from body
        classification_text = f"{heading}\n{text[:500]}" if text else heading
    elif text:
        # Use first portion of text for NO_HEADING groups
        classification_text = text[:500]
    else:
        return None
    
    if not classification_text.strip():
        return None
    
    # Use GLiNER to classify
    try:
        predictions = gliner.predict_entities(
            classification_text,
            SECTION_TYPE_LABELS,
            threshold=SECTION_TYPE_THRESHOLD,
        )
    except Exception:
        return None
    
    if not predictions:
        return None
    
    # Get the highest confidence prediction
    best = max(predictions, key=lambda p: p.get("score", 0.0))
    label = (best.get("label") or "").lower().strip()
    
    # Normalize label names
    label_map = {
        "person": "person",
        "education": "education",
        "experience": "experience",
        "skills": "skills",
        "certifications": "certifications",
        "projects": "projects",
        "activities": "activities",
        "summary": "summary",
    }
    
    return label_map.get(label)


def classify_all_sections(gliner: GLiNER, groups: List[TextGroup]) -> List[TextGroup]:
    """
    Classify all sections in a list of TextGroups.
    Updates each group's section_type field in place.
    
    Args:
        gliner: GLiNER model instance
        groups: List of TextGroup objects
        
    Returns:
        Same groups list with section_type field updated
    """
    for group in groups:
        section_type = classify_section_type(
            gliner,
            group.heading,
            group.text,
        )
        group.section_type = section_type
    
    return groups


def identify_person_section(groups: List[TextGroup]) -> Optional[TextGroup]:
    """
    Identify the person/contact information section.
    
    The person section is typically:
    1. Classified as 'person' type
    2. A NO_HEADING group at the beginning (often contains name/contact)
    3. A 'summary' section that contains contact info
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        TextGroup identified as person section, or None
    """
    # First, look for explicitly classified 'person' sections
    for group in groups:
        if group.section_type == "person":
            return group
    
    # Next, look for NO_HEADING groups that might contain person info
    for group in groups:
        if group.heading == "NO_HEADING":
            text_lower = group.text.lower()
            # Check for typical person section indicators
            has_contact_indicators = any(indicator in text_lower for indicator in [
                "@", "email", "phone", "tel:", "mobile",
            ])
            if has_contact_indicators:
                return group
    
    # Finally, check summary sections
    for group in groups:
        if group.section_type == "summary":
            return group
    
    return None


def get_sections_by_type(
    groups: List[TextGroup],
    section_type: str,
) -> List[TextGroup]:
    """
    Get all groups of a specific section type.
    
    Args:
        groups: List of TextGroup objects
        section_type: Type to filter by (e.g., 'education', 'experience')
        
    Returns:
        List of matching TextGroup objects
    """
    return [g for g in groups if g.section_type == section_type]

