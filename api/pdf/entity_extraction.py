"""
Entity extraction using GLiNER model.
Extracts section-type-specific entities for optimized performance.
"""

import logging
from typing import Dict, List, Optional

from gliner import GLiNER

from api.pdf.config import (
    ALL_ENTITY_LABELS,
    ENTITY_THRESHOLDS,
    DEFAULT_THRESHOLD,
    GLINER_MODEL_NAME,
)
from api.pdf.models import Entity, TextGroup
from api.pdf.validators import is_valid_degree, is_valid_date


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
    
    # Suppress transformers logging during load
    transformers_logger = logging.getLogger("transformers.configuration_utils")
    original_level = transformers_logger.level
    transformers_logger.setLevel(logging.WARNING)
    
    try:
        print(f"[GLiNER] Loading model: {model_name}")
        _GLINER_MODEL = GLiNER.from_pretrained(model_name)
        return _GLINER_MODEL
    finally:
        transformers_logger.setLevel(original_level)


# =============================================================================
# Section-Specific Entity Labels
# =============================================================================

def get_relevant_entity_labels(section_type: Optional[str]) -> List[str]:
    """
    Get relevant entity labels based on section type.
    This optimizes GLiNER performance and reduces false positives.
    
    Note: In the simplified pipeline, group.heading IS the section type
    (e.g., "education", "experience", "skills").
    
    Args:
        section_type: The section type (from group.heading)
        
    Returns:
        List of entity labels to extract for this section
    """
    if section_type is None:
        return ALL_ENTITY_LABELS
    
    section_type = section_type.lower()
    
    if section_type == "education":
        return ["Degree", "School", "University", "Organization", "Location", "Date"]
    
    elif section_type == "experience":
        return ["Job Title", "Company", "Organization", "Location", "Date"]
    
    elif section_type == "skills":
        return ["Skill", "Language"]
    
    elif section_type == "certifications":
        return ["Certification", "Organization", "Date"]
    
    elif section_type == "projects":
        return ["Project", "Skill", "Date"]
    
    elif section_type == "activities":
        return ["Activity", "Organization", "Location", "Date"]
    
    elif section_type == "person":
        return ["Person", "Location"]
    
    elif section_type == "summary":
        return ["Person", "Skill", "Location"]
    
    else:
        # Unknown section type - extract all
        return ALL_ENTITY_LABELS


# =============================================================================
# Threshold Checking
# =============================================================================

def passes_threshold(label: str, score: float) -> bool:
    """
    Check if an entity score passes the configured threshold for its label.
    
    Args:
        label: Entity label
        score: Confidence score
        
    Returns:
        True if score meets or exceeds threshold
    """
    threshold = ENTITY_THRESHOLDS.get(label.lower(), DEFAULT_THRESHOLD)
    return score >= threshold


# =============================================================================
# Entity Validation
# =============================================================================

def validate_entity(entity: Entity) -> bool:
    """
    Validate an extracted entity based on its type.
    Applies type-specific validation rules.
    
    Args:
        entity: Entity object to validate
        
    Returns:
        True if entity is valid
    """
    text = entity.text.strip()
    label = entity.label.lower()
    
    # Basic validation: non-empty, reasonable length
    if not text or len(text) < 2:
        return False
    
    if len(text) > 200:
        return False
    
    # Skip single all-caps tokens (often noise)
    if text.isupper() and len(text.split()) == 1 and len(text) < 10:
        return False
    
    # Type-specific validation
    if label == "degree":
        return is_valid_degree(text)
    
    if label == "date":
        return is_valid_date(text)
    
    # Person names shouldn't contain @ (might be email)
    if label == "person":
        if "@" in text:
            return False
    
    return True


# =============================================================================
# Entity Extraction
# =============================================================================

def extract_entities_from_text(
    gliner: GLiNER,
    text: str,
    labels: Optional[List[str]] = None,
    min_threshold: float = 0.0,
) -> List[Entity]:
    """
    Extract entities from text using GLiNER.
    
    Args:
        gliner: GLiNER model instance
        text: Text to extract entities from
        labels: List of entity labels to extract (defaults to ALL_ENTITY_LABELS)
        min_threshold: Minimum confidence threshold for GLiNER (0.0 to get all)
        
    Returns:
        List of validated Entity objects
    """
    if not text or not text.strip():
        return []
    
    if labels is None:
        labels = ALL_ENTITY_LABELS
    
    try:
        raw_entities = gliner.predict_entities(text, labels, threshold=min_threshold)
    except Exception as e:
        print(f"[GLiNER] Error extracting entities: {e}")
        return []
    
    # Convert to Entity objects and filter
    entities = []
    for raw in raw_entities:
        label = (raw.get("label") or "").strip()
        score = float(raw.get("score", 0.0))
        
        # Apply configured threshold
        if not passes_threshold(label, score):
            continue
        
        entity = Entity(
            text=raw["text"],
            label=label,
            score=score,
            start_char=int(raw.get("start", -1)),
            end_char=int(raw.get("end", -1)),
        )
        
        # Validate entity
        if validate_entity(entity):
            entities.append(entity)
    
    return entities


def extract_entities_for_section(
    gliner: GLiNER,
    group: TextGroup,
) -> List[Entity]:
    """
    Extract entities from a TextGroup using section-type-specific labels.
    
    Note: In the simplified pipeline, group.heading IS the section type
    (e.g., "education", "experience").
    
    Args:
        gliner: GLiNER model instance
        group: TextGroup with heading as section type
        
    Returns:
        List of extracted Entity objects
    """
    # group.heading is now the section type (e.g., "education", "experience")
    section_type = group.heading
    
    # Get relevant labels for this section type
    labels = get_relevant_entity_labels(section_type)
    
    # Extract from the full text
    entities = extract_entities_from_text(gliner, group.text, labels)
    
    return entities


def extract_entities_for_all_sections(
    gliner: GLiNER,
    groups: List[TextGroup],
) -> List[TextGroup]:
    """
    Extract entities for all sections, using section-type-specific labels.
    Updates each group's entities field in place.
    
    Args:
        gliner: GLiNER model instance
        groups: List of TextGroup objects (heading = section type)
        
    Returns:
        Same groups list with entities field updated
    """
    for group in groups:
        entities = extract_entities_for_section(gliner, group)
        group.entities = entities
    
    return groups


# =============================================================================
# Entity Aggregation Helpers
# =============================================================================

def get_entities_by_label(
    entities: List[Entity],
    label: str,
) -> List[Entity]:
    """Get all entities with a specific label."""
    label_lower = label.lower()
    return [e for e in entities if e.label.lower() == label_lower]


def get_entity_texts_by_label(
    entities: List[Entity],
    label: str,
) -> List[str]:
    """Get all entity texts with a specific label."""
    return [e.text for e in get_entities_by_label(entities, label)]


def deduplicate_entities(entities: List[Entity]) -> List[Entity]:
    """
    Deduplicate entities, keeping the highest-scoring version.
    
    Args:
        entities: List of Entity objects
        
    Returns:
        Deduplicated list, preserving highest scores
    """
    best: Dict[str, Entity] = {}
    
    for entity in entities:
        key = (entity.text.lower().strip(), entity.label.lower())
        
        if key not in best or entity.score > best[key].score:
            best[key] = entity
    
    return list(best.values())
