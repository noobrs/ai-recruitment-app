"""
Entity extraction using GLiNER model.
Extracts resume entities like skills, degrees, job titles, etc.
"""

from typing import Dict, List

from gliner import GLiNER
from gliner.model import GLiNERConfig

from api.pdf_new.config import ENTITY_LABELS, GLINER_MODEL_NAME
from api.pdf_new.utils import passes_threshold


def load_gliner_model(model_name: str = GLINER_MODEL_NAME) -> GLiNER:
    """
    Load and return the GLiNER model for entity extraction.
    """
    cfg = GLiNERConfig.from_pretrained(model_name)
    print(f"[GLiNER] Loading model: {model_name}, backbone: {cfg.model_name}")
    return GLiNER.from_pretrained(model_name)


def extract_entities_from_text(
    gliner: GLiNER,
    text: str,
    labels: List[str] = None,
    min_threshold: float = 0.0,
) -> List[Dict]:
    """
    Extract entities from text using GLiNER.

    Args:
        gliner: GLiNER model instance
        text: Text to extract entities from
        labels: List of entity labels to extract (defaults to ENTITY_LABELS)
        min_threshold: Minimum confidence threshold (0.0 to get all, filter later)

    Returns:
        List of entity dicts with text, label, score, start_char, end_char
    """
    if not text or not text.strip():
        return []

    if labels is None:
        labels = ENTITY_LABELS

    raw_entities = gliner.predict_entities(text, labels, threshold=min_threshold)

    # Format entities consistently
    formatted = []
    for entity in raw_entities:
        label = (entity.get("label") or "").strip()
        score = float(entity.get("score", 0.0))

        # Apply threshold filtering
        if not passes_threshold(label, score):
            continue

        formatted.append({
            "text": entity["text"],
            "label": label,
            "start_char": int(entity.get("start", -1)),
            "end_char": int(entity.get("end", -1)),
            "score": float(score),
        })

    return formatted


def extract_entities_from_group(
    gliner: GLiNER,
    heading: str,
    body: str,
) -> List[Dict]:
    """
    Extract entities from a grouped section (heading + body).
    Runs GLiNER on both heading and body text.

    Returns:
        List of entities that pass configured thresholds
    """
    entities = []

    # Extract from body
    entities.extend(extract_entities_from_text(gliner, body))

    # Extract from heading if it's meaningful
    if heading and heading != "NO_HEADING":
        entities.extend(extract_entities_from_text(gliner, heading))

    return entities
