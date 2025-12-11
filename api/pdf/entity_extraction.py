"""
Entity extraction using GLiNER model.
Extracts section-type-specific entities for optimized performance.
"""

from typing import List, Optional

from gliner import GLiNER

from api.pdf.config import (
    ALL_ENTITY_LABELS,
    ENTITY_THRESHOLD,
    GLINER_MODEL_NAME,
    ENTITY_LABELS_BY_SECTION,
)
from api.pdf.models import Entity, TextGroup


# =============================================================================
# Model Loading
# =============================================================================

_GLINER_MODEL: Optional[GLiNER] = None


def load_gliner_model(model_name: str = GLINER_MODEL_NAME) -> GLiNER:
    """
    Load and return the GLiNER model for entity extraction.
    Uses singleton pattern to avoid loading multiple times.
    
    Args:
        model_name: Name of the GLiNER model to load
        
    Returns:
        GLiNER model instance
    """
    global _GLINER_MODEL
    
    if _GLINER_MODEL is not None:
        return _GLINER_MODEL
    
    print(f"[GLiNER] Loading model: {model_name}")
    _GLINER_MODEL = GLiNER.from_pretrained(model_name)
    print("[GLiNER] Model loaded successfully.")
    return _GLINER_MODEL


# =============================================================================
# Entity Extraction
# =============================================================================

def extract_entities_for_all_sections(
    groups: List[TextGroup],
    min_threshold: float = ENTITY_THRESHOLD,
) -> List[TextGroup]:
    """
    Extract entities for all sections using GLiNER, applying section-specific labels.
    Updates each group's entities field in place.

    Args:
        groups: List of TextGroup objects (heading = section type)
        min_threshold: Minimum confidence threshold for GLiNER

    Returns:
        Same groups list with entities field updated
    """
    gliner = load_gliner_model()

    for group in groups:
        # 1. Validation: Skip empty text immediately
        if not group.text or not group.text.strip():
            group.entities = []
            continue

        # 2. Determine Labels: Use section-specific labels or fallback to ALL
        section_type = group.heading
        labels = ENTITY_LABELS_BY_SECTION.get(section_type.lower(), ALL_ENTITY_LABELS)

        # 3. Prediction
        try:
            raw_entities = gliner.predict_entities(group.text, labels, threshold=min_threshold)
        except Exception as e:
            print(f"[GLiNER] Error extracting entities for section '{section_type}': {e}")
            group.entities = []
            continue

        # 4. Conversion: Transform raw output into validated Entity objects
        entities = []
        for raw in raw_entities:
            label = (raw.get("label") or "").strip()
            score = float(raw.get("score", 0.0))

            entity = Entity(
                text=raw["text"],
                label=label,
                score=score,
                start_char=int(raw.get("start", -1)),
                end_char=int(raw.get("end", -1)),
            )
            entities.append(entity)

        group.entities = entities

    return groups