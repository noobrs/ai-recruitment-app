"""
Common helper utilities used across modules:
- Normalization helpers
- Similarity checks
- Threshold checks
- Duration splitting
"""

from typing import Dict, Optional, Tuple, List

from rapidfuzz import fuzz

from api.pdf.config import THRESHOLDS
from api.types.types import ResumeData, CandidateOut, EducationOut, ExperienceOut, CertificationOut, ActivityOut


def normalize_heading(text: Optional[str]) -> str:
    """
    Normalize a heading string by stripping whitespace and collapsing spaces.
    Used to ensure consistent keys when grouping layout spans.
    """
    if not text:
        return "NO_HEADING"
    return " ".join(text.strip().split())


def similar(a: str, b: str, thresh: int = 92) -> bool:
    """
    Approximate string similarity based on token-sorted fuzzy ratio.
    Used to de-duplicate similar items (e.g., similar degree strings).
    """
    return fuzz.token_sort_ratio(a, b) >= thresh


def _norm(s: str) -> str:
    """
    Normalize a string for use as a dictionary key:
    - Strip whitespace
    - Collapse spaces
    - Lowercase
    """
    return " ".join((s or "").strip().split()).lower()


def _is_valid_item(text: str) -> bool:
    """
    Basic sanity checks for extracted text items (skills, etc.):
    - Non-empty
    - Reasonable length
    - Avoid single all-caps tokens (often headings or noise)
    """
    if not text:
        return False
    t = text.strip()
    if len(t) < 3 or len(t) > 120:
        return False
    if t.isupper() and len(t.split()) == 1:
        return False
    return True


def _update_best(best: Dict[str, float], text: str, score: float) -> None:
    """
    Maintain a dict of best scores for normalized texts.
    If the text is new or has a higher score, update the dict.
    """
    if not _is_valid_item(text):
        return
    key = _norm(text)
    if key not in best or score > best[key]:
        best[key] = float(score)


def _pass_threshold(label: str, score: float) -> bool:
    """
    Check if an entity score passes the configured label threshold.
    Falls back to 0.50 when label not explicitly listed.
    """
    need = THRESHOLDS.get(label.lower(), 0.50)
    return score >= need


def split_duration(duration: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Convert a string like 'Jan 2020 - Present' or '2020 - 2023'
    into (start_date, end_date) as plain strings.

    Used when mapping "duration" into start_date/end_date in output models.
    """
    import re

    if not duration:
        return None, None
    parts = re.split(r"\s*[-–]\s*", duration)
    if len(parts) == 2:
        start = parts[0].strip() or None
        end = parts[1].strip() or None
        return start, end
    # Fallback: whole string is start_date
    return duration.strip(), None


__all__ = [
    "normalize_heading",
    "similar",
    "_norm",
    "_is_valid_item",
    "_update_best",
    "_pass_threshold",
    "split_duration",
]

def convert_resume_dict_to_api_response(resume_dict: Dict) -> ResumeData:
    """
    Convert the internal resume dict (from resume_builder) into
    a ResumeData Pydantic model, performing minor transformations:
      - Combine level + field to degree string
      - Split duration into start_date / end_date
      - Map "position" to job_title for experience
      - Derive activity name from first line of description
    """
    # candidate
    candidate_model = CandidateOut(**resume_dict["candidate"])

    # education mapping: level + field -> degree, duration -> start/end
    edu_models: List[EducationOut] = []
    for e in resume_dict["education"]:
        level = e.get("level")
        field = e.get("field")
        if level and field:
            degree = f"{level} in {field}"
        else:
            degree = level or field

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

    # experience mapping: position -> job_title, duration -> start/end
    exp_models: List[ExperienceOut] = []
    for ex in resume_dict["experience"]:
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

    # certifications already {name, description}
    cert_models = [CertificationOut(**c) for c in resume_dict["certifications"]]

    # activities: existing only description -> name + description
    act_models: List[ActivityOut] = []
    for a in resume_dict["activities"]:
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
        skills=resume_dict["skills"],
        certifications=cert_models,
        activities=act_models,
    )