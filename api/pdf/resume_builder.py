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
from typing import Dict, List, Tuple, Optional, Any

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


def _normalize_phone(s: str) -> str:
    """
    Normalize a phone number string by keeping only digit characters.
    This makes matching phone numbers in layout spans more robust.
    """
    return "".join(ch for ch in (s or "") if ch.isdigit())


def _extract_bbox_from_layout(layout_obj: Any) -> Optional[Dict[str, float]]:
    """
    Best-effort extraction of (page_index, x0, y0, x1, y1) from span._.layout.
    Mirrors the logic used in layout_extraction so that we can attach
    coordinates to candidate info once and reuse them for redaction.
    """
    if layout_obj is None:
        return None

    # Page index (0-based)
    page_num = getattr(layout_obj, "page_number", None)
    if page_num is None:
        page_num = getattr(layout_obj, "page", None)
    if page_num is None:
        page_index = 0
    else:
        try:
            page_index = max(0, int(page_num) - 1)
        except Exception:
            page_index = 0

    # Bounding box
    x0 = getattr(layout_obj, "x", None)
    y0 = getattr(layout_obj, "y", None)
    width = getattr(layout_obj, "width", None)
    height = getattr(layout_obj, "height", None)
    x1 = x0 + width if x0 is not None and width is not None else None
    y1 = y0 + height if y0 is not None and height is not None else None
    if None in (x0, y0, x1, y1):
        return None
    return {
        "page_index": float(page_index),
        "x0": float(x0),
        "y0": float(y0),
        "x1": float(x1),
        "y1": float(y1),
    }


def _collect_candidate_regions_from_doc(
    doc: Any,
    name: Optional[str],
    email: Optional[str],
    phone: Optional[str],
) -> List[Dict[str, Any]]:
    """
    Locate layout spans that contain the candidate's name / email / phone
    and return their coordinates. This is used so that the pipeline can
    pass exact regions to the redaction step without re-running any search.
    """
    regions: List[Dict[str, Any]] = []

    if doc is None or not hasattr(doc, "spans"):
        return regions

    try:
        layout_spans = doc.spans["layout"]
    except Exception:
        return regions

    name_tokens = [t.lower() for t in re.split(r"\s+", name) if t] if name else []
    email_lower = email.lower() if email else ""
    phone_digits = _normalize_phone(phone) if phone else ""

    for span in layout_spans:
        raw_text = span.text or ""
        if not raw_text.strip():
            continue

        text_lower = raw_text.lower()
        hit = False

        # Email: direct substring (case-insensitive)
        if email_lower and email_lower in text_lower:
            hit = True

        # Phone: digit-only substring match
        if not hit and phone_digits:
            span_digits = _normalize_phone(raw_text)
            if phone_digits and phone_digits in span_digits:
                hit = True

        # Name: require all tokens present in this span text
        if not hit and name_tokens:
            if all(tok in text_lower for tok in name_tokens):
                hit = True

        if not hit:
            continue

        layout_obj = getattr(span._, "layout", None)
        bbox = _extract_bbox_from_layout(layout_obj)
        if bbox is None:
            continue

        # Slight padding to fully cover the text box
        pad = 1.0
        regions.append(
            {
                "page_index": int(bbox["page_index"]),
                "bbox": (
                    float(bbox["x0"] - pad),
                    float(bbox["y0"] - pad),
                    float(bbox["x1"] + pad),
                    float(bbox["y1"] + pad),
                ),
            }
        )

    return regions


def extract_candidate_info(
    full_text: str,
    gliner: GLiNER,
    doc: Optional[Any] = None,
) -> Dict:
    """
    Extract candidate-level info: name, email, phone, location.

    Email & phone: regex.
    Name & location: GLiNER on first ~2000 chars of text.

    When a spaCy-Layout Doc is provided, this function will also attach
    pre-computed layout coordinates for the candidate info (under the
    "regions" key). These coordinates can be passed directly to the
    redaction pipeline so we don't have to search for the same text again.
    """
    email_match = EMAIL_RE.search(full_text)
    phone_match = PHONE_RE.search(full_text)

    ents = gliner.predict_entities(
        full_text[:2000], ["Person", "Location"], threshold=0.5
    )
    name = None
    location = None
    for e in ents:
        label = (e.get("label") or "").lower()
        if label == "person" and not name:
            name = e["text"].strip()
        elif label == "location" and not location:
            location = e["text"].strip()

    email_text = email_match.group(0) if email_match else None
    phone_text = phone_match.group(0) if phone_match else None

    regions: List[Dict[str, Any]] = []
    if doc is not None:
        regions = _collect_candidate_regions_from_doc(doc, name, email_text, phone_text)

    return {
        "name": name,
        "email": email_text,
        "phone": phone_text,
        "location": location,
        # NEW: list of {page_index, bbox=(x0,y0,x1,y1)} regions for candidate info
        "regions": regions,
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
