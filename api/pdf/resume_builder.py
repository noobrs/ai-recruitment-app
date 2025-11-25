"""
Logic for building structured resume information from layout + GLiNER groups:
- Candidate info (name, email, phone, location)
- Skills list
- Education entries
- Experience entries
- Certifications and activities

Updated to:
- ignore NO_HEADING groups for skills/edu/exp
- relate edu/exp entities only within a local degree / job-title "block"
- clean description text via simple text-cleaning
"""

from collections import defaultdict
from typing import Dict, List, Tuple

import re
from gliner import GLiNER

from api.pdf.utils import _norm, _update_best
from api.pdf.regexes import (
    DATE_RANGE_RE,
    EMAIL_RE,
    PHONE_RE,
    extract_majors_from_text,
)


# -----------------
# Helpers
# -----------------


_BULLET_LINE_RE = re.compile(r"^[\s\u2022\u2023\u25E6\u2043\-\*•]+")
_MULTI_SPACE_RE = re.compile(r"\s+")


def _is_no_heading(g: Dict) -> bool:
    return (g.get("heading") or "").upper() == "NO_HEADING"


def clean_description(text: str) -> str:
    """
    Simple text cleaning for description blocks:
      - strip leading bullet characters
      - remove empty lines
      - collapse multiple spaces
    """
    if not text:
        return ""

    lines = []
    for line in text.splitlines():
        line = _BULLET_LINE_RE.sub("", line).strip()
        if not line:
            continue
        lines.append(line)

    if not lines:
        return ""

    cleaned = " ".join(lines)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned).strip()
    return cleaned


def _make_window(text: str, start: int, end: int, radius: int = 250) -> Tuple[str, int, int]:
    """
    Build a local text window around an anchor [start, end] index.
    Returns (window_text, window_start, window_end).
    """
    if start < 0 or end < 0:
        return text, 0, len(text)

    window_start = max(0, start - radius)
    window_end = min(len(text), end + radius)
    return text[window_start:window_end], window_start, window_end


def _in_window(ent: Dict, window_start: int, window_end: int) -> bool:
    pos = int(ent.get("start_char", -1))
    if pos < 0:
        return False
    return window_start <= pos <= window_end


# -----------------
# Candidate
# -----------------


def extract_candidate_info(full_text: str, gliner: GLiNER) -> Dict:
    """
    Extract candidate-level info: name, email, phone, location.

    Email & phone: regex.
    Name & location: GLiNER on first ~2000 chars of text.
    """
    email_match = EMAIL_RE.search(full_text)
    phone_match = PHONE_RE.search(full_text)

    ents = gliner.predict_entities(
        full_text[:2000], ["Person", "Location"], threshold=0.5
    )
    name = None
    location = None
    for e in ents:
        if e["label"].lower() == "person" and not name:
            name = e["text"].strip()
        elif e["label"].lower() == "location" and not location:
            location = e["text"].strip()

    return {
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "location": location,
    }


# -----------------
# Skills / Languages
# -----------------


def build_skills(groups: List[Dict]) -> List[str]:
    """
    Aggregate Skill entities across all non-NO_HEADING groups and
    de-duplicate based on best scores.
    """
    best: Dict[str, float] = {}
    for g in groups:
        if _is_no_heading(g):
            continue
        ents = g.get("entities", [])
        for e in ents:
            lbl = e["label"].lower()
            if lbl == "skill":
                _update_best(best, e["text"], e["score"])
    items = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
    return [k for k, _ in items]


def build_languages(groups: List[Dict]) -> List[str]:
    """
    Aggregate Language entities across all non-NO_HEADING groups and
    de-duplicate based on best scores.
    """
    best: Dict[str, float] = {}
    for g in groups:
        if _is_no_heading(g):
            continue
        ents = g.get("entities", [])
        for e in ents:
            lbl = e["label"].lower()
            if lbl == "language":
                _update_best(best, e["text"], e["score"])
    items = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
    return [k for k, _ in items]


# -----------------
# Education
# -----------------


def build_education(groups: List[Dict]) -> List[Dict]:
    """
    Build education records from groups having an education-like heading
    or containing Degree entities.

    Relationship logic:
    - For each Degree entity, build a local window ("block") around it.
    - Within that window, look for organization, location and date range.
    - Extract majors using regex on that local block.
    - Use the cleaned block as the description.

    Each record:
      - level
      - field
      - institution
      - location
      - duration (raw text, e.g. '2019 - 2023')
      - description (cleaned text of the block)
    """
    edu_records: List[Dict] = []

    for g in groups:
        if _is_no_heading(g):
            continue

        head = (g.get("heading") or "").lower()
        is_edu_group = any(
            k in head for k in ["education", "academic", "qualification", "study"]
        )
        ents = g.get("entities", []) or []
        text = g.get("text", "") or ""

        degree_ents = [e for e in ents if e["label"].lower() == "degree"]

        # Fallback: old behavior when no explicit degree entity
        if not degree_ents and not is_edu_group:
            continue

        if not degree_ents:
            # One coarse record from the entire group
            majors = extract_majors_from_text(text)
            orgs = [
                e["text"]
                for e in ents
                if e["label"].lower()
                in ("school", "university", "organization", "company")
            ]
            locs = [e["text"] for e in ents if e["label"].lower() == "location"]
            duration_match = DATE_RANGE_RE.search(text)

            level = None
            field = majors[0] if majors else None
            institution = orgs[0] if orgs else None
            location = locs[0] if locs else None
            duration = duration_match.group(0) if duration_match else None

            if any([field, institution, duration]):
                edu_records.append(
                    {
                        "level": level,
                        "field": field,
                        "institution": institution,
                        "location": location,
                        "duration": duration,
                        "description": clean_description(text),
                    }
                )
            continue

        # Fine-grained records per degree "block"
        for d in degree_ents:
            window_text, w_start, w_end = _make_window(
                text, d.get("start_char", -1), d.get("end_char", -1)
            )

            local_ents = [e for e in ents if _in_window(e, w_start, w_end)]
            local_orgs = [
                e["text"]
                for e in local_ents
                if e["label"].lower()
                in ("school", "university", "organization", "company")
            ]
            local_locs = [
                e["text"]
                for e in local_ents
                if e["label"].lower() == "location"
            ]

            # Prefer date range inside the local block, then the whole group
            duration_match = DATE_RANGE_RE.search(window_text) or DATE_RANGE_RE.search(
                text
            )

            majors = extract_majors_from_text(window_text or text)

            level = d["text"].strip()
            field = majors[0] if majors else None
            institution = local_orgs[0] if local_orgs else None
            location = local_locs[0] if local_locs else None
            duration = duration_match.group(0) if duration_match else None
            description = clean_description(window_text or text)

            if any([level, field, institution, duration, description]):
                edu_records.append(
                    {
                        "level": level,
                        "field": field,
                        "institution": institution,
                        "location": location,
                        "duration": duration,
                        "description": description,
                    }
                )

    # De-duplicate roughly by a key tuple
    unique: List[Dict] = []
    seen = set()
    for rec in edu_records:
        key = (rec["level"], rec["field"], rec["institution"], rec["duration"])
        if key not in seen:
            seen.add(key)
            unique.append(rec)
    return unique


# -----------------
# Experience
# -----------------


def build_experience(groups: List[Dict]) -> List[Dict]:
    """
    Build experience records from groups that look like work experience sections
    or contain Job Title entities.

    Relationship logic:
    - For each Job Title entity, build a local window ("block") around it.
    - Within that window, look for company, location and date range.
    - Use the cleaned local block as the description.

    Each record:
      - position
      - company
      - location
      - duration
      - description
    """
    exp_records: List[Dict] = []

    for g in groups:
        if _is_no_heading(g):
            continue

        head = (g.get("heading") or "").lower()
        is_exp_group = any(
            k in head for k in ["experience", "employment", "work", "career", "professional"]
        )
        ents = g.get("entities", []) or []
        text = g.get("text", "") or ""

        title_ents = [e for e in ents if e["label"].lower() == "job title"]

        if not is_exp_group and not title_ents:
            continue

        if not title_ents:
            # Fallback: group-level record
            duration_match = DATE_RANGE_RE.search(text)
            locs = [e["text"] for e in ents if e["label"].lower() == "location"]
            orgs = [
                e["text"]
                for e in ents
                if e["label"].lower() in ("organization", "company")
            ]

            position = None
            company = orgs[0] if orgs else None
            location = locs[0] if locs else None
            duration = duration_match.group(0) if duration_match else None
            description = clean_description(text)

            if any([company, location, duration, description]):
                exp_records.append(
                    {
                        "position": position,
                        "company": company,
                        "location": location,
                        "duration": duration,
                        "description": description,
                    }
                )
            continue

        # Fine-grained records per job-title block
        for t in title_ents:
            window_text, w_start, w_end = _make_window(
                text, t.get("start_char", -1), t.get("end_char", -1)
            )

            local_ents = [e for e in ents if _in_window(e, w_start, w_end)]
            local_locs = [
                e["text"]
                for e in local_ents
                if e["label"].lower() == "location"
            ]
            local_orgs = [
                e["text"]
                for e in local_ents
                if e["label"].lower() in ("organization", "company")
            ]

            duration_match = DATE_RANGE_RE.search(window_text) or DATE_RANGE_RE.search(
                text
            )

            position = t["text"].strip()
            company = local_orgs[0] if local_orgs else None
            location = local_locs[0] if local_locs else None
            duration = duration_match.group(0) if duration_match else None
            description = clean_description(window_text or text)

            if any([position, company, duration, description]):
                exp_records.append(
                    {
                        "position": position,
                        "company": company,
                        "location": location,
                        "duration": duration,
                        "description": description,
                    }
                )

    # De-duplicate by position + company + duration
    unique: List[Dict] = []
    seen = set()
    for rec in exp_records:
        key = (rec["position"], rec["company"], rec["duration"])
        if key not in seen:
            seen.add(key)
            unique.append(rec)
    return unique


# -----------------
# Certifications / Activities (unchanged except NO_HEADING guard)
# -----------------


def build_certifications(groups: List[Dict]) -> List[Dict]:
    """
    Build certification records from groups whose heading suggests
    certifications / licenses / awards.

    Each line in the group text is treated as a potential certification.
    """
    certs: List[Dict] = []
    for g in groups:
        if _is_no_heading(g):
            continue
        head = (g.get("heading") or "").lower()
        is_cert_group = any(
            k in head for k in ["certification", "license", "licence", "award"]
        )
        if not is_cert_group:
            continue
        text = g.get("text", "") or ""
        for line in text.splitlines():
            line = line.strip()
            if len(line) < 4:
                continue
            certs.append({"name": line, "description": line})

    # De-duplicate by normalized name
    seen = set()
    unique: List[Dict] = []
    for c in certs:
        k = _norm(c["name"])
        if k not in seen:
            seen.add(k)
            unique.append(c)
    return unique


def build_activities(groups: List[Dict]) -> List[Dict]:
    """
    Build activity/project/volunteer records from relevant sections.
    Each group becomes one activity with the full description text.
    """
    acts: List[Dict] = []
    for g in groups:
        if _is_no_heading(g):
            continue
        head = (g.get("heading") or "").lower()
        if any(
            k in head
            for k in ["activity", "activities", "project", "volunteer", "extracurricular"]
        ):
            txt = (g.get("text") or "").strip()
            if txt:
                acts.append({"description": txt})
    return acts
