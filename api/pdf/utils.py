"""
Common utility functions for PDF resume extraction.
"""

import re
from typing import Dict, Optional, Tuple, List
from rapidfuzz import fuzz

from api.pdf.config import ENTITY_THRESHOLDS, DEFAULT_THRESHOLD
from api.types.types import ResumeData, CandidateOut, EducationOut, ExperienceOut, CertificationOut, ActivityOut


def normalize_text(text: Optional[str]) -> str:
    """Normalize text by stripping whitespace and collapsing spaces."""
    if not text:
        return ""
    return " ".join(text.strip().split())


def normalize_key(s: str) -> str:
    """
    Normalize a string for use as a dictionary key:
    - Strip whitespace, collapse spaces, lowercase
    """
    return " ".join((s or "").strip().split()).lower()


def is_similar(a: str, b: str, threshold: int = 92) -> bool:
    """
    Check if two strings are similar using fuzzy matching.
    Used for de-duplication.
    """
    return fuzz.token_sort_ratio(a, b) >= threshold


def is_valid_text(text: str, min_len: int = 3, max_len: int = 120) -> bool:
    """
    Basic validation for extracted text:
    - Non-empty
    - Reasonable length
    - Avoid single all-caps tokens (often noise)
    """
    if not text:
        return False
    t = text.strip()
    if len(t) < min_len or len(t) > max_len:
        return False
    if t.isupper() and len(t.split()) == 1:
        return False
    return True


def passes_threshold(label: str, score: float) -> bool:
    """
    Check if an entity score passes the configured threshold for its label.
    """
    threshold = ENTITY_THRESHOLDS.get(label.lower(), DEFAULT_THRESHOLD)
    return score >= threshold


def update_best_score(best: Dict[str, float], text: str, score: float) -> None:
    """
    Maintain a dict of best scores for normalized texts.
    Updates if text is new or has a higher score.
    """
    if not is_valid_text(text):
        return
    key = normalize_key(text)
    if key not in best or score > best[key]:
        best[key] = float(score)


def split_duration(duration: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Split duration string like 'Jan 2020 - Present' into (start_date, end_date).
    """
    if not duration:
        return None, None
    parts = re.split(r"\s*[-–]\s*", duration)
    if len(parts) == 2:
        start = parts[0].strip() or None
        end = parts[1].strip() or None
        return start, end
    return duration.strip(), None


def clean_description(text: str) -> str:
    """
    Clean description text by:
    - Removing bullet points
    - Removing empty lines
    - Collapsing multiple spaces
    """
    if not text:
        return ""

    bullet_re = re.compile(r"^[\s\u2022\u2023\u25E6\u2043\-\*•]+")
    multi_space_re = re.compile(r"\s+")

    lines = []
    for line in text.splitlines():
        line = bullet_re.sub("", line).strip()
        if line:
            lines.append(line)

    if not lines:
        return ""

    cleaned = " ".join(lines)
    cleaned = multi_space_re.sub(" ", cleaned).strip()
    return cleaned


def make_text_window(text: str, start: int, end: int, radius: int = 250) -> Tuple[str, int, int]:
    """
    Create a text window around a specific position.
    Returns (window_text, window_start, window_end).
    """
    if start < 0 or end < 0:
        return text, 0, len(text)

    window_start = max(0, start - radius)
    window_end = min(len(text), end + radius)
    return text[window_start:window_end], window_start, window_end


def is_in_window(entity: Dict, window_start: int, window_end: int) -> bool:
    """Check if entity position falls within a text window."""
    pos = int(entity.get("start_char", -1))
    if pos < 0:
        return False
    return window_start <= pos <= window_end


def convert_to_resume_data(resume_dict: Dict) -> ResumeData:
    """
    Convert internal resume dict to ResumeData Pydantic model.
    Performs necessary transformations for API response format.
    """
    # Candidate info
    cand_src = resume_dict.get("candidate") or {}
    if hasattr(cand_src, "dict"):
        cand_src = cand_src.dict()
    else:
        cand_src = dict(cand_src)

    candidate_model = CandidateOut(
        name=cand_src.get("name"),
        email=cand_src.get("email"),
        phone=cand_src.get("phone"),
        location=cand_src.get("location"),
    )

    # Education: use title as degree, split duration
    edu_models: List[EducationOut] = []
    for e in resume_dict.get("education", []):
        degree = e.get("title")
        start_date, end_date = split_duration(e.get("duration"))

        edu_models.append(
            EducationOut(
                degree=degree,
                institution=e.get("institution"),
                location=e.get("location"),
                start_date=start_date,
                end_date=end_date,
                description=e.get("description"),
            )
        )

    # Experience: position -> job_title, split duration
    exp_models: List[ExperienceOut] = []
    for ex in resume_dict.get("experience", []):
        start_date, end_date = split_duration(ex.get("duration"))
        exp_models.append(
            ExperienceOut(
                job_title=ex.get("position"),
                company=ex.get("company"),
                location=ex.get("location"),
                start_date=start_date,
                end_date=end_date,
                description=ex.get("description"),
            )
        )

    # Certifications
    cert_models = [
        CertificationOut(**c) for c in resume_dict.get("certifications", [])
    ]

    # Activities: derive name from first line of description
    act_models: List[ActivityOut] = []
    for a in resume_dict.get("activities", []):
        desc = a.get("description") or ""
        first_line = desc.splitlines()[0].strip() if desc else None
        act_models.append(
            ActivityOut(
                name=first_line,
                description=desc or None,
            )
        )

    return ResumeData(
        candidate=candidate_model,
        education=edu_models,
        experience=exp_models,
        skills=resume_dict.get("skills", []),
        certifications=cert_models,
        activities=act_models,
    )
