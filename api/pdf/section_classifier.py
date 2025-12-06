"""
Section type classification using GLiNER.
Classifies resume section headings into types: person, education, experience, skills, etc.
"""

from typing import Dict, List, Optional

from gliner import GLiNER

from api.pdf.config import SECTION_TYPE_LABELS


# =============================================================================
# Heading Classification
# =============================================================================

def classify_heading(gliner: GLiNER, heading: str) -> Optional[str]:
    """
    Classify a section heading using GLiNER.
    
    Uses the GLiNER model to understand the semantic meaning of the heading
    and map it to a standard section type.
    
    Args:
        gliner: GLiNER model instance
        heading: Section heading text to classify
        
    Returns:
        Section type string (lowercase) or None if classification fails.
        Possible values: "person", "education", "experience", "skills",
                        "certifications", "projects", "activities", "summary"
    """
    if not heading or not heading.strip():
        return None
    
    heading = heading.strip()
    
    # Use GLiNER to classify the heading
    try:
        predictions = gliner.predict_entities(heading, SECTION_TYPE_LABELS)
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
        "activities": "activities",
        "projects": "projects",
        "summary": "summary",
    }
    
    return label_map.get(label)


def classify_headings_batch(
    gliner: GLiNER,
    headings: List[str],
) -> Dict[str, Optional[str]]:
    """
    Classify multiple headings and return a mapping of heading -> section type.
    
    Args:
        gliner: GLiNER model instance
        headings: List of heading texts to classify
        
    Returns:
        Dict mapping each heading to its section type (or None)
    """
    result = {}
    
    for heading in headings:
        section_type = classify_heading(gliner, heading)
        result[heading] = section_type
        
    return result
