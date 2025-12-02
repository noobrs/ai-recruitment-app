"""
Configuration for PDF resume extraction pipeline.
Simplified and focused on essential entity types and thresholds.
"""

from typing import Dict, List, Set

# GLiNER model for entity extraction
GLINER_MODEL_NAME: str = "urchade/gliner_small-v2.1"

# Entity labels for resume extraction
ENTITY_LABELS: List[str] = [
    # Core resume entities
    "Skill",
    "Language",
    "Degree",
    "Job Title",
    # Supporting entities for relationships
    "Organization",
    "Company",
    "School",
    "University",
    "Location",
    "Person",
    "Certification",
    "Award",
    "Activity",
    "Project",
    "Date",
]

# Section type labels for classification
SECTION_TYPE_LABELS: List[str] = [
    "Education",
    "Experience",
    "Skills",
    "Certifications",
    "Projects",
    "Activities",
    "Summary",
]

# Confidence thresholds for entity extraction
ENTITY_THRESHOLDS: Dict[str, float] = {
    "skill": 0.50,
    "language": 0.50,
    "degree": 0.50,
    "job title": 0.50,
    "organization": 0.50,
    "company": 0.50,
    "school": 0.50,
    "university": 0.50,
    "location": 0.50,
    "person": 0.50,
    "certification": 0.50,
    "award": 0.50,
    "activity": 0.50,
    "project": 0.50,
    "date": 0.50,
}

# Threshold for section type classification
SECTION_TYPE_THRESHOLD: float = 0.00

# spaCy-layout span labels to skip (tables, pictures, etc.)
SKIP_SPAN_LABELS: Set[str] = {"table", "picture", "equation"}

# Default threshold for entities not explicitly listed
DEFAULT_THRESHOLD: float = 0.50
