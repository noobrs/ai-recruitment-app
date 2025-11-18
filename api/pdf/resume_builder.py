"""
Logic for building structured resume information from layout + GLiNER groups:
- Candidate info (name, email, phone, location)
- Skills list
- Education entries
- Experience entries
- Certifications and activities
"""

from collections import defaultdict
from typing import Dict, List

from gliner import GLiNER

from api.pdf.utils import _norm, _update_best
from api.pdf.regexes import (
    DATE_RANGE_RE,
    EMAIL_RE,
    PHONE_RE,
    extract_majors_from_text,
)


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


def build_skills(groups: List[Dict]) -> List[str]:
    """
    Aggregate Skill entities across all groups and de-duplicate
    based on best scores.
    """
    best: Dict[str, float] = {}
    for g in groups:
        ents = g.get("entities", [])
        for e in ents:
            lbl = e["label"].lower()
            if lbl == "skill":
                _update_best(best, e["text"], e["score"])
    items = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
    return [k for k, _ in items]


def build_languages(groups: List[Dict]) -> List[str]:
    """
    Aggregate Language entities across all groups and de-duplicate
    based on best scores.
    """
    best: Dict[str, float] = {}
    for g in groups:
        ents = g.get("entities", [])
        for e in ents:
            lbl = e["label"].lower()
            if lbl == "language":
                _update_best(best, e["text"], e["score"])
    items = sorted(best.items(), key=lambda kv: kv[1], reverse=True)
    return [k for k, _ in items]


def build_education(groups: List[Dict]) -> List[Dict]:
    """
    Build education records from groups having an education-like heading
    or containing Degree entities.

    Each record:
      - level
      - field
      - institution
      - location
      - duration (raw text, e.g. '2019 - 2023')
      - description (full text of the group)
    """
    edu_records: List[Dict] = []
    for g in groups:
        head = (g.get("heading") or "").lower()
        is_edu_group = any(
            k in head for k in ["education", "academic", "qualification", "study"]
        )
        ents = g.get("entities", [])
        if not is_edu_group and not any(
            e["label"].lower() == "degree" for e in ents
        ):
            continue

        text = g.get("text", "") or ""
        majors = extract_majors_from_text(text)
        orgs = [
            e["text"]
            for e in ents
            if e["label"].lower()
            in ("school", "university", "organization", "company")
        ]
        locs = [e["text"] for e in ents if e["label"].lower() == "location"]
        degrees = [e["text"] for e in ents if e["label"].lower() == "degree"]
        duration_match = DATE_RANGE_RE.search(text)

        level = degrees[0] if degrees else None
        field = majors[0] if majors else None
        institution = orgs[0] if orgs else None
        location = locs[0] if locs else None
        duration = duration_match.group(0) if duration_match else None

        if any([level, field, institution, duration]):
            edu_records.append(
                {
                    "level": level,
                    "field": field,
                    "institution": institution,
                    "location": location,
                    "duration": duration,
                    "description": text.strip(),
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


def build_experience(groups: List[Dict]) -> List[Dict]:
    """
    Build experience records from groups that look like work experience sections
    or contain Job Title entities.

    Each record:
      - position
      - company
      - location
      - duration
      - description
    """
    exp_records: List[Dict] = []

    for g in groups:
        head = (g.get("heading") or "").lower()
        is_exp_group = any(
            k in head for k in ["experience", "employment", "work", "career", "professional"]
        )
        ents = g.get("entities", [])
        if not is_exp_group and not any(
            e["label"].lower() == "job title" for e in ents
        ):
            continue

        text = g.get("text", "") or ""
        duration_match = DATE_RANGE_RE.search(text)
        locs = [e["text"] for e in ents if e["label"].lower() == "location"]
        orgs = [
            e["text"] for e in ents if e["label"].lower() in ("organization", "company")
        ]
        titles = [e for e in ents if e["label"].lower() == "job title"]

        for t in titles:
            position = t["text"].strip()
            company = orgs[0] if orgs else None
            location = locs[0] if locs else None
            duration = duration_match.group(0) if duration_match else None

            exp_records.append(
                {
                    "position": position,
                    "company": company,
                    "location": location,
                    "duration": duration,
                    "description": text.strip(),
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


def build_certifications(groups: List[Dict]) -> List[Dict]:
    """
    Build certification records from groups whose heading suggests
    certifications / licenses / awards.

    Each line in the group text is treated as a potential certification.
    """
    certs: List[Dict] = []
    for g in groups:
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
        head = (g.get("heading") or "").lower()
        if any(
            k in head
            for k in ["activity", "activities", "project", "volunteer", "extracurricular"]
        ):
            txt = (g.get("text") or "").strip()
            if txt:
                acts.append({"description": txt})
    return acts