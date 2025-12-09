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
ENTITY_THRESHOLD: float = 0.30

# =============================================================================
# Common Section Headers (Fast-path classification)
# =============================================================================

# Maps canonical section types to a list of common resume headers
# key: canonical section type
# value: list of common string variations
COMMON_SECTION_HEADERS: Dict[str, List[str]] = {
    "contact": [
        "contact",
        "contacts",
        "contact information",
        "contact info",
        "personal information",
        "personal info",
        "personal details",
        "contact details",
    ],
    "experience": [
        "experience",
        "experiences",
        "work experience",
        "professional experience",
        "employment history",
        "employment",
        "work history",
        "career history",
        "professional background",
        "working experience",
        "job experience",
        "relevant experience",
        "internship",
        "internships",
        "internship experience",
    ],
    "education": [
        "education",
        "educations",
        "educational background",
        "academic background",
        "academic qualifications",
        "qualifications",
        "educational qualifications",
        "academic history",
        "schooling",
        "academics",
    ],
    "skills": [
        "skills",
        "skills",
        "technical skills",
        "core skills",
        "key skills",
        "professional skills",
        "competencies",
        "core competencies",
        "expertise",
        "areas of expertise",
        "proficiencies",
        "technologies",
        "tools",
        "tools & technologies",
        "programming languages",
        "languages",
        "language skills",
        "soft skills",
        "hard skills",
        "it skills",
        "computer skills",
    ],
    "summary": [
        "summary",
        "professional summary",
        "executive summary",
        "career summary",
        "profile",
        "professional profile",
        "about me",
        "about",
        "objective",
        "career objective",
        "professional objective",
        "introduction",
        "overview",
    ],
    "projects": [
        "projects",
        "project",
        "personal projects",
        "academic projects",
        "key projects",
        "selected projects",
        "portfolio",
        "work samples",
    ],
    "certifications": [
        "certifications",
        "certification",
        "certificates",
        "certificate",
        "professional certifications",
        "licenses",
        "licenses & certifications",
        "credentials",
        "accreditations",
        "training",
        "professional training",
        "courses",
    ],
    "awards": [
        "awards",
        "award",
        "honors",
        "honours",
        "achievements",
        "accomplishments",
        "awards & honors",
        "awards and honors",
        "recognition",
        "honors & awards",
    ],
    "activities": [
        "activities",
        "extracurricular activities",
        "extra curricular activities",
        "interests",
        "hobbies",
        "hobbies & interests",
        "hobbies and interests",
        "volunteer experience",
        "volunteering",
        "volunteer work",
        "community involvement",
        "leadership",
        "leadership experience",
        "affiliations",
        "memberships",
        "professional affiliations",
        "organizations",
    ],
    "other": [
        "publications",
        "research",
        "research experience",
        "papers",
        "presentations",
        "references",
        "reference",
    ],
}

# =============================================================================
# Layout Parser Configuration
# =============================================================================

SKIP_SPAN_LABELS: Set[str] = {"table", "picture", "equation", "figure"}

# =============================================================================
# Regex Patterns
# =============================================================================

EMAIL_PATTERN: str = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"

PHONE_PATTERNS: List[str] = [
    r"\+60\s*[\d\s\-()]{8,12}",
    r"01[0-9]\s*[-.]?\s*\d{3,4}\s*[-.]?\s*\d{4}",
    r"0[3-9]\s*[-.]?\s*\d{4}\s*[-.]?\s*\d{4}",
    r"\(\d{2,3}\)\s*\d{3,4}\s*[-.]?\s*\d{4}",
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
