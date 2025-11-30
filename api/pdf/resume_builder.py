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
from api.pdf.layout_parser import extract_bbox

# Contact information patterns
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"\+?\d[\d\s\-()]{7,}")

def extract_candidate_info(
    full_text: str,
    gliner: GLiNER,
    doc: Optional[Any] = None,
) -> List[Dict]:
    """
    Extract candidate information: name, email, phone, location for multiple candidates.

    Args:
        full_text: Full resume text
        gliner: GLiNER model instance
        doc: Optional spaCy Doc with layout info (for coordinate extraction)

    Returns:
        List of dicts, each with name, email, phone, location, and optionally coordinate regions
    """
    # Extract all emails and phones using regex
    emails = [match.group(0) for match in EMAIL_RE.finditer(full_text)]
    phones = [match.group(0) for match in PHONE_RE.finditer(full_text)]

    # Extract all names and locations using GLiNER (from first 5000 chars to capture more)
    entities = gliner.predict_entities(
        full_text[:5000],
        ["Person", "Location"],
        threshold=0.5,
    )

    # Separate entities by type
    names = [entity for entity in entities if (entity.get("label") or "").lower() == "person"]
    locations = [entity for entity in entities if (entity.get("label") or "").lower() == "location"]

    # If no names found, create a single candidate with available info
    if not names:
        email_text = emails[0] if emails else None
        phone_text = phones[0] if phones else None
        location_text = locations[0]["text"].strip() if locations else None

        regions = []
        if doc is not None:
            regions = _extract_candidate_regions(doc, None, email_text, phone_text)

        return [{
            "name": None,
            "email": email_text,
            "phone": phone_text,
            "location": location_text,
            "regions": regions,
        }]

    # Build candidates by associating each name with nearest email/phone/location
    candidates = []
    used_emails = set()
    used_phones = set()
    used_locations = set()

    for name_entity in names:
        name_text = name_entity["text"].strip()
        name_pos = name_entity.get("start", 0)

        # Find closest email (not already used)
        closest_email = None
        min_email_dist = float('inf')
        for i, email in enumerate(emails):
            if i not in used_emails:
                email_pos = full_text.find(email)
                if email_pos != -1:
                    dist = abs(email_pos - name_pos)
                    if dist < min_email_dist:
                        min_email_dist = dist
                        closest_email = (i, email)

        if closest_email:
            used_emails.add(closest_email[0])
            email_text = closest_email[1]
        else:
            email_text = None

        # Find closest phone (not already used)
        closest_phone = None
        min_phone_dist = float('inf')
        for i, phone in enumerate(phones):
            if i not in used_phones:
                phone_pos = full_text.find(phone)
                if phone_pos != -1:
                    dist = abs(phone_pos - name_pos)
                    if dist < min_phone_dist:
                        min_phone_dist = dist
                        closest_phone = (i, phone)

        if closest_phone:
            used_phones.add(closest_phone[0])
            phone_text = closest_phone[1]
        else:
            phone_text = None

        # Find closest location (not already used)
        closest_location = None
        min_loc_dist = float('inf')
        for i, loc_entity in enumerate(locations):
            if i not in used_locations:
                loc_pos = loc_entity.get("start", 0)
                dist = abs(loc_pos - name_pos)
                if dist < min_loc_dist:
                    min_loc_dist = dist
                    closest_location = (i, loc_entity["text"].strip())

        if closest_location:
            used_locations.add(closest_location[0])
            location_text = closest_location[1]
        else:
            location_text = None

        # Extract coordinate regions if doc provided
        regions = []
        if doc is not None:
            regions = _extract_candidate_regions(doc, name_text, email_text, phone_text)

        candidates.append({
            "name": name_text,
            "email": email_text,
            "phone": phone_text,
            "location": location_text,
            "regions": regions,
        })

    return candidates


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


def _extract_degree_field(entities: List[Dict], text: str = "") -> Optional[str]:
    """
    Extract degree field/major from Degree entities.
    Falls back to first degree entity if found.
    """
    degree_entities = [e for e in entities if e["label"].lower() == "degree"]
    if degree_entities:
        # Return the first degree text
        return degree_entities[0]["text"].strip()
    return None


def _extract_date_range(entities: List[Dict], text: str = "") -> Optional[str]:
    """
    Extract date range from Date entities.
    Tries to find two dates for a range, or a single date.
    """
    date_entities = [e for e in entities if e["label"].lower() == "date"]

    if not date_entities:
        return None

    # If we have multiple dates, combine them as a range
    if len(date_entities) >= 2:
        start_date = date_entities[0]["text"].strip()
        end_date = date_entities[1]["text"].strip()
        return f"{start_date} - {end_date}"

    # Single date entity
    if len(date_entities) == 1:
        date_text = date_entities[0]["text"].strip()
        # Check if it already contains a range indicator
        if any(sep in date_text for sep in ["-", "–", "to", "TO"]):
            return date_text
        # Otherwise return as single date
        return date_text

    return None


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
            degree_title = _extract_degree_field(entities, text)
            orgs = [
                e["text"] for e in entities
                if e["label"].lower() in ("school", "university", "organization", "company")
            ]
            locs = [e["text"] for e in entities if e["label"].lower() == "location"]
            duration = _extract_date_range(entities, text)

            edu_records.append({
                "title": degree_title,
                "institution": orgs[0] if orgs else None,
                "location": locs[0] if locs else None,
                "duration": duration,
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

            # Try to get date from local entities first, fallback to all entities
            duration = _extract_date_range(local_entities, window_text)
            if not duration:
                duration = _extract_date_range(entities, text)

            # Extract the full degree title as is (no splitting into level and field)
            degree_title = degree_entity["text"].strip()

            edu_records.append({
                "title": degree_title,
                "institution": local_orgs[0] if local_orgs else None,
                "location": local_locs[0] if local_locs else None,
                "duration": duration,
                "description": clean_description(window_text or text),
            })

    # De-duplicate: keep only one entry if institution, duration, and location match
    # Prefer the entry with the longest description
    unique_map = {}
    for rec in edu_records:
        # Use institution, duration, location as the key (ignore title for deduplication)
        key = (rec["institution"], rec["duration"], rec["location"])

        if key not in unique_map:
            unique_map[key] = rec
        else:
            # Keep the record with the longer description
            existing_desc_len = len(unique_map[key].get("description") or "")
            new_desc_len = len(rec.get("description") or "")
            if new_desc_len > existing_desc_len:
                unique_map[key] = rec

    return list(unique_map.values())


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
            duration = _extract_date_range(entities, text)
            locs = [e["text"] for e in entities if e["label"].lower() == "location"]
            orgs = [
                e["text"] for e in entities
                if e["label"].lower() in ("organization", "company")
            ]

            exp_records.append({
                "position": None,
                "company": orgs[0] if orgs else None,
                "location": locs[0] if locs else None,
                "duration": duration,
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

            # Try to get date from local entities first, fallback to all entities
            duration = _extract_date_range(local_entities, window_text)
            if not duration:
                duration = _extract_date_range(entities, text)

            exp_records.append({
                "position": title_entity["text"].strip(),
                "company": local_orgs[0] if local_orgs else None,
                "location": local_locs[0] if local_locs else None,
                "duration": duration,
                "description": clean_description(window_text or text),
            })

    # De-duplicate: keep only one entry if company, duration, and location match
    # Prefer the entry with the longest description
    unique_map = {}
    for rec in exp_records:
        # Use company, duration, location as the key (ignore position for deduplication)
        key = (rec["company"], rec["duration"], rec["location"])

        if key not in unique_map:
            unique_map[key] = rec
        else:
            # Keep the record with the longer description
            existing_desc_len = len(unique_map[key].get("description") or "")
            new_desc_len = len(rec.get("description") or "")
            if new_desc_len > existing_desc_len:
                unique_map[key] = rec

    return list(unique_map.values())


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
