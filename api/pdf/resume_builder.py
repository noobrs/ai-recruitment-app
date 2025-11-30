"""
Build structured resume data from classified sections and extracted entities.
Uses ML-based section classification instead of hardcoded keywords.
"""

import re
from collections import defaultdict
from typing import Dict, List, Optional, Any

from gliner import GLiNER

from api.pdf.utils import (
    normalize_key,
    update_best_score,
    clean_description,
    make_text_window,
    is_in_window,
)
from api.pdf.regexes import EMAIL_RE, PHONE_RE, DATE_RANGE_RE, extract_majors
from api.pdf.layout_parser import extract_bbox


def extract_candidate_info(
    full_text: str,
    gliner: GLiNER,
    doc: Optional[Any] = None,
) -> Dict:
    """
    Extract candidate information: name, email, phone, location.

    Args:
        full_text: Full resume text
        gliner: GLiNER model instance
        doc: Optional spaCy Doc with layout info (for coordinate extraction)

    Returns:
        Dict with name, email, phone, location, and optionally coordinate regions
    """
    # Extract email and phone using regex
    email_match = EMAIL_RE.search(full_text)
    phone_match = PHONE_RE.search(full_text)

    # Extract name and location using GLiNER (from first 2000 chars)
    entities = gliner.predict_entities(
        full_text[:2000],
        ["Person", "Location"],
        threshold=0.5,
    )

    name = None
    location = None
    for entity in entities:
        label = (entity.get("label") or "").lower()
        if label == "person" and not name:
            name = entity["text"].strip()
        elif label == "location" and not location:
            location = entity["text"].strip()

    email_text = email_match.group(0) if email_match else None
    phone_text = phone_match.group(0) if phone_match else None

    # Extract coordinate regions if doc provided
    regions = []
    if doc is not None:
        regions = _extract_candidate_regions(doc, name, email_text, phone_text)

    return {
        "name": name,
        "email": email_text,
        "phone": phone_text,
        "location": location,
        "regions": regions,
    }


def _extract_candidate_regions(
    doc: Any,
    name: Optional[str],
    email: Optional[str],
    phone: Optional[str],
) -> List[Dict[str, Any]]:
    """
    Find layout spans containing candidate info and return their coordinates.
    """
    regions = []

    if doc is None or not hasattr(doc, "spans"):
        return regions

    try:
        layout_spans = doc.spans["layout"]
    except Exception:
        return regions

    # Prepare search terms
    name_tokens = [t.lower() for t in re.split(r"\s+", name) if t] if name else []
    email_lower = email.lower() if email else ""
    phone_digits = "".join(ch for ch in (phone or "") if ch.isdigit())

    for span in layout_spans:
        raw_text = span.text or ""
        if not raw_text.strip():
            continue

        text_lower = raw_text.lower()
        is_match = False

        # Check for email
        if email_lower and email_lower in text_lower:
            is_match = True

        # Check for phone (digit-only comparison)
        if not is_match and phone_digits:
            span_digits = "".join(ch for ch in raw_text if ch.isdigit())
            if phone_digits and phone_digits in span_digits:
                is_match = True

        # Check for name (all tokens must be present)
        if not is_match and name_tokens:
            if all(token in text_lower for token in name_tokens):
                is_match = True

        if not is_match:
            continue

        # Extract bounding box
        layout_obj = getattr(span._, "layout", None)
        bbox = extract_bbox(layout_obj)
        if bbox is None:
            continue

        # Add with padding
        pad = 1.0
        regions.append({
            "page_index": int(bbox["page_index"]),
            "bbox": (
                float(bbox["x0"] - pad),
                float(bbox["y0"] - pad),
                float(bbox["x1"] + pad),
                float(bbox["y1"] + pad),
            ),
        })

    return regions


def build_skills(groups: List[Dict]) -> List[str]:
    """
    Extract and aggregate skill entities from groups.
    Uses section_type classification instead of hardcoded keywords.
    """
    best_scores: Dict[str, float] = {}

    for group in groups:
        # Skip NO_HEADING groups
        if group.get("heading") == "NO_HEADING":
            continue

        # Get entities from this group
        entities = group.get("entities", [])

        for entity in entities:
            label = entity["label"].lower()
            if label == "skill":
                update_best_score(best_scores, entity["text"], entity["score"])

    # Return sorted by score
    items = sorted(best_scores.items(), key=lambda kv: kv[1], reverse=True)
    return [text for text, _ in items]


def build_languages(groups: List[Dict]) -> List[str]:
    """Extract and aggregate language entities from groups."""
    best_scores: Dict[str, float] = {}

    for group in groups:
        if group.get("heading") == "NO_HEADING":
            continue

        entities = group.get("entities", [])
        for entity in entities:
            label = entity["label"].lower()
            if label == "language":
                update_best_score(best_scores, entity["text"], entity["score"])

    items = sorted(best_scores.items(), key=lambda kv: kv[1], reverse=True)
    return [text for text, _ in items]


def build_education(groups: List[Dict]) -> List[Dict]:
    """
    Build education records from classified education sections.
    Uses section_type='education' instead of hardcoded keywords.
    """
    edu_records = []

    for group in groups:
        if group.get("heading") == "NO_HEADING":
            continue

        # Use ML-based classification
        section_type = group.get("section_type")
        entities = group.get("entities", [])
        text = group.get("text", "")

        # Check for degree entities or education section type
        degree_entities = [e for e in entities if e["label"].lower() == "degree"]
        is_education = section_type == "education"

        if not degree_entities and not is_education:
            continue

        # If no degree entities, create one record for the whole group
        if not degree_entities:
            majors = extract_majors(text)
            orgs = [
                e["text"] for e in entities
                if e["label"].lower() in ("school", "university", "organization", "company")
            ]
            locs = [e["text"] for e in entities if e["label"].lower() == "location"]
            duration_match = DATE_RANGE_RE.search(text)

            edu_records.append({
                "level": None,
                "field": majors[0] if majors else None,
                "institution": orgs[0] if orgs else None,
                "location": locs[0] if locs else None,
                "duration": duration_match.group(0) if duration_match else None,
                "description": clean_description(text),
            })
            continue

        # Create records for each degree entity
        for degree_entity in degree_entities:
            window_text, w_start, w_end = make_text_window(
                text,
                degree_entity.get("start_char", -1),
                degree_entity.get("end_char", -1),
            )

            local_entities = [e for e in entities if is_in_window(e, w_start, w_end)]
            local_orgs = [
                e["text"] for e in local_entities
                if e["label"].lower() in ("school", "university", "organization", "company")
            ]
            local_locs = [
                e["text"] for e in local_entities
                if e["label"].lower() == "location"
            ]

            duration_match = DATE_RANGE_RE.search(window_text) or DATE_RANGE_RE.search(text)
            majors = extract_majors(window_text or text)

            edu_records.append({
                "level": degree_entity["text"].strip(),
                "field": majors[0] if majors else None,
                "institution": local_orgs[0] if local_orgs else None,
                "location": local_locs[0] if local_locs else None,
                "duration": duration_match.group(0) if duration_match else None,
                "description": clean_description(window_text or text),
            })

    # De-duplicate
    unique = []
    seen = set()
    for rec in edu_records:
        key = (rec["level"], rec["field"], rec["institution"], rec["duration"])
        if key not in seen:
            seen.add(key)
            unique.append(rec)

    return unique


def build_experience(groups: List[Dict]) -> List[Dict]:
    """
    Build experience records from classified experience sections.
    Uses section_type='experience' instead of hardcoded keywords.
    """
    exp_records = []

    for group in groups:
        if group.get("heading") == "NO_HEADING":
            continue

        section_type = group.get("section_type")
        entities = group.get("entities", [])
        text = group.get("text", "")

        # Check for job title entities or experience section type
        title_entities = [e for e in entities if e["label"].lower() == "job title"]
        is_experience = section_type == "experience"

        if not title_entities and not is_experience:
            continue

        # If no title entities, create one record for the whole group
        if not title_entities:
            duration_match = DATE_RANGE_RE.search(text)
            locs = [e["text"] for e in entities if e["label"].lower() == "location"]
            orgs = [
                e["text"] for e in entities
                if e["label"].lower() in ("organization", "company")
            ]

            exp_records.append({
                "position": None,
                "company": orgs[0] if orgs else None,
                "location": locs[0] if locs else None,
                "duration": duration_match.group(0) if duration_match else None,
                "description": clean_description(text),
            })
            continue

        # Create records for each job title
        for title_entity in title_entities:
            window_text, w_start, w_end = make_text_window(
                text,
                title_entity.get("start_char", -1),
                title_entity.get("end_char", -1),
            )

            local_entities = [e for e in entities if is_in_window(e, w_start, w_end)]
            local_locs = [
                e["text"] for e in local_entities
                if e["label"].lower() == "location"
            ]
            local_orgs = [
                e["text"] for e in local_entities
                if e["label"].lower() in ("organization", "company")
            ]

            duration_match = DATE_RANGE_RE.search(window_text) or DATE_RANGE_RE.search(text)

            exp_records.append({
                "position": title_entity["text"].strip(),
                "company": local_orgs[0] if local_orgs else None,
                "location": local_locs[0] if local_locs else None,
                "duration": duration_match.group(0) if duration_match else None,
                "description": clean_description(window_text or text),
            })

    # De-duplicate
    unique = []
    seen = set()
    for rec in exp_records:
        key = (rec["position"], rec["company"], rec["duration"])
        if key not in seen:
            seen.add(key)
            unique.append(rec)

    return unique


def build_certifications(groups: List[Dict]) -> List[Dict]:
    """
    Build certifications from classified certification sections.
    Uses section_type='certifications' instead of hardcoded keywords.
    """
    certs = []

    for group in groups:
        if group.get("heading") == "NO_HEADING":
            continue

        section_type = group.get("section_type")
        if section_type != "certifications":
            continue

        text = group.get("text", "")
        for line in text.splitlines():
            line = line.strip()
            if len(line) >= 4:
                certs.append({
                    "name": line,
                    "description": line,
                })

    # De-duplicate
    unique = []
    seen = set()
    for cert in certs:
        key = normalize_key(cert["name"])
        if key not in seen:
            seen.add(key)
            unique.append(cert)

    return unique


def build_activities(groups: List[Dict]) -> List[Dict]:
    """
    Build activities from classified activity/project sections.
    Uses section_type in ('activities', 'projects') instead of hardcoded keywords.
    """
    activities = []

    for group in groups:
        if group.get("heading") == "NO_HEADING":
            continue

        section_type = group.get("section_type")
        if section_type not in ("activities", "projects"):
            continue

        text = (group.get("text") or "").strip()
        if text:
            activities.append({
                "description": text,
            })

    return activities
