"""
Section type classification using GLiNER.
Replaces hardcoded keyword matching with ML-based classification.
"""

from typing import Dict, Optional
from gliner import GLiNER

from api.pdf.config import SECTION_TYPE_LABELS, SECTION_TYPE_THRESHOLD


def classify_section_type(
    gliner: GLiNER,
    heading: str,
    text: str,
) -> Optional[str]:
    """
    Classify the type of a resume section using GLiNER.

    This uses the GLiNER model to understand the semantic meaning of the section.

    Args:
        gliner: GLiNER model instance
        heading: Section heading text
        text: Section body text (used as context)

    Returns:
        Section type string or None if classification confidence is too low.
        Possible values: "education", "experience", "skills", "certifications",
                        "projects", "activities", "summary"
    """
    # Prepare text for classification (prioritize heading, include some context)
    classification_text = heading
    if text:
        # Add some context from the body
        context = text
        classification_text = f"{heading}\n{' '.join(context.strip().split())}"

    if not classification_text or classification_text == "NO_HEADING":
        return None

    # Use GLiNER to classify the section type
    predictions = gliner.predict_entities(
        classification_text,
        SECTION_TYPE_LABELS,
        threshold=SECTION_TYPE_THRESHOLD,
    )

    if not predictions:
        return None

    # Get the highest confidence prediction
    best = max(predictions, key=lambda p: p.get("score", 0.0))
    label = best.get("label", "").lower()

    # Normalize label names
    label_map = {
        "education": "education",
        "experience": "experience",
        "skills": "skills",
        "certifications": "certifications",
        "projects": "projects",
        "activities": "activities",
        "summary": "summary",
    }

    return label_map.get(label)


def classify_all_sections(gliner: GLiNER, groups: list[Dict]) -> list[Dict]:
    """
    Classify all sections in a list of grouped spans.
    Adds a 'section_type' field to each group.

    Args:
        gliner: GLiNER model instance
        groups: List of grouped spans from layout parser

    Returns:
        Same groups list with 'section_type' field added to each group
    """
    for group in groups:
        heading = group.get("heading", "")
        text = group.get("text", "")

        section_type = classify_section_type(gliner, heading, text)
        group["section_type"] = section_type

    return groups
