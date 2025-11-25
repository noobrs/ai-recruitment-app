"""
Regular expressions and helpers for:
- Emails
- Phone numbers
- Date ranges
- Degree / major extraction
"""

import re
from typing import List

from api.pdf.utils import similar

# Regex for contact info & dates
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"\+?\d[\d\s\-()]{7,}")
DATE_RANGE_RE = re.compile(
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}"
    r"|\d{4})\s*[-–]\s*(Present|\d{4}|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4})",
    re.IGNORECASE,
)

# ----------------------------
# Degree / Major extraction (regex)
# ----------------------------

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


def _infer_degree_prefix(context: str) -> str:
    """
    Infer a degree prefix ('Bachelor of', 'Master of', etc.) from nearby text context.
    Used to build nicer degree strings.
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


def extract_majors_from_text(text: str) -> List[str]:
    """
    Run degree/major regex patterns over text to identify possible majors,
    then apply context-based prefix and de-duplicate via fuzzy similarity.
    """
    majors: List[str] = []
    for pat in DEGREE_PATTERNS:
        for m in re.finditer(pat, text, flags=re.IGNORECASE):
            span_text = text[max(0, m.start() - 30) : m.end() + 30]
            major_core = m.group(1) if m.lastindex else ""
            major_core = re.sub(r"[\s,.;:)\]]+$", "", (major_core or "").strip())
            prefix = _infer_degree_prefix(span_text)
            pretty = f"{prefix}{major_core}" if prefix else major_core
            if pretty and all(not similar(pretty, x) for x in majors):
                majors.append(pretty)
    return majors


__all__ = [
    "EMAIL_RE",
    "PHONE_RE",
    "DATE_RANGE_RE",
    "extract_majors_from_text",
]
