"""
Configuration for PDF resume extraction pipeline (New Version).
Optimized for section-type-specific entity extraction.
"""

from typing import Dict, List, Set

# =============================================================================
# Model Configuration
# =============================================================================

GLINER_MODEL_NAME: str = "urchade/gliner_small-v2.1"

# =============================================================================
# Section Types for Classification
# =============================================================================

SECTION_TYPE_LABELS: List[str] = [
    "Person",        # Personal info section (name, contact)
    "Education",     # Academic background
    "Experience",    # Work experience / employment history
    "Skills",        # Technical/soft skills
    "Certifications", # Professional certifications
    "Activities",    # Extracurricular activities
    "Summary",       # Profile summary/objective
]

# Threshold for section type classification
SECTION_TYPE_THRESHOLD: float = 0.20

# =============================================================================
# Entity Labels by Section Type
# =============================================================================

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

# Section-specific entity labels for optimized extraction
ENTITY_LABELS_BY_SECTION: Dict[str, List[str]] = {
    "person": ["Person", "Location"],  # Name extracted via GLiNER, others via regex
    "education": ["Degree", "School", "University", "Organization", "Location", "Date"],
    "experience": ["Job Title", "Company", "Organization", "Location", "Date"],
    "skills": ["Skill", "Language"],
    "certifications": ["Certification"],
    "activities": ["Activity"],
    "summary": ["Person", "Skill", "Location"],  # Summary might mention skills
}

# =============================================================================
# Confidence Thresholds
# =============================================================================

ENTITY_THRESHOLDS: Dict[str, float] = {
    "person": 0.50,
    "skill": 0.50,
    "language": 0.50,
    "degree": 0.50,
    "job title": 0.50,
    "organization": 0.50,
    "company": 0.50,
    "school": 0.50,
    "university": 0.50,
    "location": 0.50,
    "certification": 0.50,
    "award": 0.50,
    "activity": 0.50,
    "date": 0.50,
}

DEFAULT_THRESHOLD: float = 0.50

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

# =============================================================================
# Text Processing
# =============================================================================

# Maximum characters to consider for person section extraction
PERSON_SECTION_MAX_CHARS: int = 1500