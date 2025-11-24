"""
Global constants for models, labels, thresholds, and spaCy-layout options.
"""

from typing import Dict, List, Set

GLINER_MODEL_NAME: str = "urchade/gliner_large-v2.1"

# Work-related labels for extraction
WORK_LABELS: List[str] = ["Skill", "Language", "Degree", "Job Title"]

# Bias-related labels that we want to detect and gate
BIAS_LABELS: List[str] = ["Race", "Ethnicity", "Gender", "Sex"]

# Extra labels to help build relationships for education / experience
EXTRA_LABELS: List[str] = [
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

# Combined label list passed to GLiNER
GLINER_LABELS: List[str] = list({*WORK_LABELS, *BIAS_LABELS, *EXTRA_LABELS})

# Confidence thresholds for each label
THRESHOLDS: Dict[str, float] = {
    # work
    "skill": 0.50,
    "language": 0.50,
    "degree": 0.50,
    "job title": 0.50,
    # bias (stricter)
    "race": 0.50,
    "ethnicity": 0.50,
    "gender": 0.50,
    "sex": 0.50,
    # extras: default 0.50 if not found in dict
}

# Minimum score for regex-based education extraction (not used directly but kept for clarity)
REGEX_EDU_SCORE: float = 0.50

# spaCy-layout span labels to skip (tables, pictures, etc.)
SKIP_SPAN_LABELS: Set[str] = {"table", "picture", "equation"}
