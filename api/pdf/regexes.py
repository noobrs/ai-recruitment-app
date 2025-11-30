"""
Regular expressions for extracting structured information from text:
- Email addresses
- Phone numbers
- Date ranges
- Degree/major patterns
"""

import re
from typing import List

from api.pdf.utils import is_similar


# Contact information patterns
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"\+?\d[\d\s\-()]{7,}")

# Date range pattern
DATE_RANGE_RE = re.compile(
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}"
    r"|\d{4})\s*[-–]\s*(Present|\d{4}|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4})",
    re.IGNORECASE,
)

# Degree patterns for major extraction
DEGREE_PATTERNS = [
    r"\bBachelor(?:'s)?\s+(?:of\s+)?([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bBachelor(?:'s)?\s+in\s+([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bB\.?\s?(?:Sc|Eng|Tech|CompSci|CS|IT|A|BA)\b(?:\s*\(Hons?\))?\s+([A-Z][\w &/().,-]{2,})",
    r"\bMaster(?:'s)?\s+(?:of\s+)?([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bMaster(?:'s)?\s+in\s+([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bM\.?\s?(?:Sc|Eng|Tech|IT|BA|PA|Ed)\b(?:\s*\(Hons?\))?\s+([A-Z][\w &/().,-]{2,})",
    r"\bMBA\b(?:\s?(?:in|of)\s([A-Z][\w &/().,-]{2,}))?",
    r"\bPh\.?D\.?\s+in\s+([A-Z][\w &/().,-]{2,})",
    r"\bDoctor\s+of\s+([A-Z][\w &/().,-]{2,})",
    r"\bDPhil\s+in\s+([A-Z][\w &/().,-]{2,})",
    r"\bDiploma\s+(?:in|of)\s+([A-Z][\w &/().,-]{2,})",
]


def infer_degree_prefix(context: str) -> str:
    """
    Infer degree prefix ('Bachelor of', 'Master of', etc.) from surrounding text.
    """
    ctx = context.lower()
    if "bachelor" in ctx or re.search(r"\bB\.?\s?(Sc|Eng|Tech|A|CS|IT)\b", ctx, re.I):
        return "Bachelor of "
    if (
        "master" in ctx
        or re.search(r"\bM\.?\s?(Sc|Eng|Tech|IT|BA|PA|Ed)\b", ctx, re.I)
        or "mba" in ctx
    ):
        return "Master of "
    if "phd" in ctx or "doctor of" in ctx or "dphil" in ctx:
        return "Doctor of "
    if "diploma" in ctx:
        return "Diploma in "
    return ""


def extract_majors(text: str) -> List[str]:
    """
    Extract degree majors from text using regex patterns.
    Returns de-duplicated list of majors with inferred prefixes.
    """
    majors: List[str] = []
    for pattern in DEGREE_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            # Get context around match for prefix inference
            span_text = text[max(0, match.start() - 30) : match.end() + 30]

            # Extract major field
            major_core = match.group(1) if match.lastindex else ""
            major_core = re.sub(r"[\s,.;:)\]]+$", "", (major_core or "").strip())

            # Add prefix based on context
            prefix = infer_degree_prefix(span_text)
            pretty = f"{prefix}{major_core}" if prefix else major_core

            # De-duplicate using fuzzy matching
            if pretty and all(not is_similar(pretty, existing) for existing in majors):
                majors.append(pretty)

    return majors
