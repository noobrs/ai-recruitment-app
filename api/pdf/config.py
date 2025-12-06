"""
Configuration for PDF resume extraction pipeline (New Version).
Optimized for section-type-specific entity extraction.
"""

from typing import Dict, List, Set

# =============================================================================
# Model Configuration
# =============================================================================

GLINER_MODEL_NAME: str = "urchade/gliner_small-v2.1"
SECTION_CLASSIFIER_MODEL_NAME: str = "facebook/bart-large-mnli"

# =============================================================================
# Section Types for Classification
# =============================================================================

SECTION_TYPE_LABELS: List[str] = [
    # "Personally Identifiable Information",        # Personal info section (name, contact)
    # "Education",     # Academic background
    # "Experience",    # Work experience / employment history
    # "Languages",     # Languages spoken
    # "Skills",        # Technical/soft skills
    # "Certifications", # Professional certifications
    # "Activities",    # Extracurricular activities
    # "Summary",       # Profile summary/objective
    "candidate contact information",
    "professional experience",
    "education and university degree",
    "skills and tools",
    "languages",
    "certifications and awards",
    "extracurricular activities",
    "professional summary"
]

# =============================================================================
# Entity Labels by Section Type
# =============================================================================

# Section-specific entity labels for optimized extraction
ENTITY_LABELS_BY_SECTION: Dict[str, List[str]] = {
    "candidate contact information": ["Person", "Location"],
    "professional experience": ["Job Title", "Company", "Organization", "Location", "Date"],
    "education and university degree": ["Degree", "School", "University", "Organization", "Location", "Date"],
    "skills and tools": ["Skill"],
    "languages": ["Language"],
    "certifications and awards": ["Certification"],
    "extracurricular activities": ["Activity"],
    "professional summary": ["Person", "Skill", "Location"],
    # "candidate contact information": ["Person", "Location"],
    # "education and university degree": ["Degree", "School", "University", "Organization", "Location", "Date"],
    # "work experience and job history": ["Job Title", "Company", "Organization", "Location", "Date"],
    # "technical skills and tools": ["Skill"],
    # "spoken languages": ["Language"],
    # "certifications and awards": ["Certification"],
    # "extracurricular activities": ["Activity"],
    # "professional summary": ["Person", "Skill", "Location"],  # Summary might mention skills
    # "activities": ["Activity"],
    # "summary": ["Person", "Skill", "Location"],  # Summary might mention skills
}

# All possible entity labels (used as fallback)
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

# Entity Threshold
ENTITY_THRESHOLD: float = 0.50

# =============================================================================
# Layout Parser Configuration
# =============================================================================

# spaCy-layout span labels to skip (non-text content)
SKIP_SPAN_LABELS: Set[str] = {"table", "picture", "equation", "figure"}

# =============================================================================
# Regex Patterns
# =============================================================================

# Email pattern
EMAIL_PATTERN: str = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# Malaysia phone patterns:
# - +60 followed by 1-2 digits (area code) and 7-8 digits
# - 01X followed by 7-8 digits (mobile)
# - 03/04/05/06/07/08/09 followed by 7-8 digits (landline)
PHONE_PATTERNS: List[str] = [
    r"\+60\s*[\d\s\-()]{8,12}",           # International format +60
    r"01[0-9]\s*[-.]?\s*\d{3,4}\s*[-.]?\s*\d{4}",  # Mobile: 01X-XXX-XXXX or 01X-XXXX-XXXX
    r"0[3-9]\s*[-.]?\s*\d{4}\s*[-.]?\s*\d{4}",     # Landline: 0X-XXXX-XXXX
]

# Degree validation patterns
DEGREE_PATTERNS: List[str] = [
    # Common degree abbreviations
    r"(?i)\b(?:B\.?A\.?|B\.?S\.?c?\.?|B\.?Eng\.?|B\.?Tech\.?|B\.?Com\.?)\b",
    r"(?i)\b(?:M\.?A\.?|M\.?S\.?c?\.?|M\.?Eng\.?|M\.?Tech\.?|M\.?B\.?A\.?|M\.?Phil\.?)\b",
    r"(?i)\b(?:Ph\.?D\.?|D\.?Phil\.?|Ed\.?D\.?|D\.?B\.?A\.?)\b",
    r"(?i)\b(?:Diploma|Certificate|Certification)\b",
    # Full degree names
    r"(?i)\bBachelor(?:'s)?\s+(?:of|in)\b",
    r"(?i)\bMaster(?:'s)?\s+(?:of|in)\b",
    r"(?i)\bDoctor(?:ate)?\s+(?:of|in)\b",
    r"(?i)\bAssociate(?:'s)?\s+(?:Degree|of|in)\b",
    # # Specific programs
    # r"(?i)\b(?:Engineering|Science|Arts|Commerce|Business|Law|Medicine)\b",
    # r"(?i)\b(?:Computer Science|Information Technology|Software Engineering)\b",
]

# Date validation patterns
DATE_PATTERNS: List[str] = [
    # Month Year formats
    r"(?i)(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[,.]?\s*\d{4}",
    # Year only
    r"\b(?:19|20)\d{2}\b",
    # MM/YYYY or MM-YYYY
    r"\b(?:0?[1-9]|1[0-2])\s*[/\-]\s*(?:19|20)\d{2}\b",
    # Present/Current
    r"(?i)\b(?:Present|Current|Now|Ongoing)\b",
]
