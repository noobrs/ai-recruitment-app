"""
Configuration for PDF resume extraction pipeline.
Uses BERT for section classification and GLiNER for entity extraction.
"""

from typing import Dict, List, Set

# =============================================================================
# Model Configuration
# =============================================================================

# BERT model for section classification
SECTION_CLASSIFIER_MODEL: str = "has-abi/bert-finetuned-resumes-sections"

# GLiNER model for entity extraction
GLINER_MODEL_NAME: str = "urchade/gliner_small-v2.1"

# =============================================================================
# Section Merge Mapping
# =============================================================================

# Maps BERT model labels to canonical section names used in the pipeline
# Model labels: awards, certificates, contact/name/title, education, interests,
#               languages, para, professional_experiences, projects, skills,
#               soft_skills, summary
SECTION_MERGE_MAP: Dict[str, str] = {
    "awards": "awards",
    "certificates": "certifications",
    "contact/name/title": "contact",
    "education": "education",
    "interests": "activities",
    "languages": "skills",
    "para": "other",
    "professional_experiences": "experience",
    "projects": "projects",
    "skills": "skills",
    "soft_skills": "skills",
    "summary": "summary",
}

# =============================================================================
# Entity Labels by Section Type (for GLiNER)
# =============================================================================

ENTITY_LABELS_BY_SECTION: Dict[str, List[str]] = {
    "contact": ["Person", "Location"],
    "experience": ["Job Title", "Company", "Organization", "Location", "Date"],
    "education": ["Degree", "School", "University", "Organization", "Location", "Date"],
    "skills": ["Skill", "Language"],
    "projects": ["Project"],
    "certifications": ["Certification"],
    "activities": ["Activity"],
    "summary": ["Person", "Skill", "Location"],
    "awards": ["Award", "Date"],
    "other": ["Person", "Skill", "Location", "Date"],
}

# All possible entity labels (fallback)
ALL_ENTITY_LABELS: List[str] = [
    "Person",
    "Skill",
    "Language",
    "Degree",
    "Job Title",
    "Organization",
    "Company",
    "School",
    "University",
    "Location",
    "Certification",
    "Award",
    "Activity",
    "Date",
]

# Entity confidence threshold
ENTITY_THRESHOLD: float = 0.50

# =============================================================================
# Layout Parser Configuration
# =============================================================================

SKIP_SPAN_LABELS: Set[str] = {"table", "picture", "equation", "figure"}

# =============================================================================
# Regex Patterns
# =============================================================================

EMAIL_PATTERN: str = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

PHONE_PATTERNS: List[str] = [
    r"\+60\s*[\d\s\-()]{8,12}",
    r"01[0-9]\s*[-.]?\s*\d{3,4}\s*[-.]?\s*\d{4}",
    r"0[3-9]\s*[-.]?\s*\d{4}\s*[-.]?\s*\d{4}",
]

DEGREE_PATTERNS: List[str] = [
    r"(?i)\b(?:B\.?A\.?|B\.?S\.?c?\.?|B\.?Eng\.?|B\.?Tech\.?|B\.?Com\.?)\b",
    r"(?i)\b(?:M\.?A\.?|M\.?S\.?c?\.?|M\.?Eng\.?|M\.?Tech\.?|M\.?B\.?A\.?|M\.?Phil\.?)\b",
    r"(?i)\b(?:Ph\.?D\.?|D\.?Phil\.?|Ed\.?D\.?|D\.?B\.?A\.?)\b",
    r"(?i)\b(?:Diploma|Certificate|Certification)\b",
    r"(?i)\bBachelor(?:'s)?\s+(?:of|in)\b",
    r"(?i)\bMaster(?:'s)?\s+(?:of|in)\b",
    r"(?i)\bDoctor(?:ate)?\s+(?:of|in)\b",
    r"(?i)\bAssociate(?:'s)?\s+(?:Degree|of|in)\b",
]

DATE_PATTERNS: List[str] = [
    r"(?i)(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[,.]?\s*\d{4}",
    r"\b(?:19|20)\d{2}\b",
    r"\b(?:0?[1-9]|1[0-2])\s*[/\-]\s*(?:19|20)\d{2}\b",
    r"(?i)\b(?:Present|Current|Now|Ongoing)\b",
]
