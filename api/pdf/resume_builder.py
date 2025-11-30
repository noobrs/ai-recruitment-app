"""
Build structured resume data from classified sections and extracted entities.
Uses ML-based section classification instead of hardcoded keywords.
"""

from typing import Dict, List

from api.pdf.utils import clean_description, make_text_window, is_in_window
from api.pdf.extraction_helpers import (
    extract_entities_by_label,
    extract_date_range,
    extract_degree_field,
    deduplicate_records,
    deduplicate_by_name,
)


def build_skills(groups: List[Dict]) -> List[str]:
    """
    Extract and aggregate skill entities from groups.
    Uses section_type classification instead of hardcoded keywords.
    """
    return extract_entities_by_label(groups, "skill")


def build_languages(groups: List[Dict]) -> List[str]:
    """Extract and aggregate language entities from groups."""
    return extract_entities_by_label(groups, "language")


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
            edu_records.append(_build_education_record(entities, text, None))
            continue

        # Create records for each degree entity
        for degree_entity in degree_entities:
            window_text, w_start, w_end = make_text_window(
                text,
                degree_entity.get("start_char", -1),
                degree_entity.get("end_char", -1),
            )

            local_entities = [e for e in entities if is_in_window(e, w_start, w_end)]

            # Try to get date from local entities first, fallback to all entities
            duration = extract_date_range(local_entities, window_text)
            if not duration:
                duration = extract_date_range(entities, text)

            edu_records.append(
                _build_education_record(
                    local_entities,
                    window_text or text,
                    degree_entity["text"].strip(),
                    duration,
                )
            )

    # Deduplicate by institution, duration, and location
    return deduplicate_records(edu_records, ("institution", "duration", "location"))


def _build_education_record(
    entities: List[Dict],
    text: str,
    degree_title: str = None,
    duration: str = None,
) -> Dict:
    """Helper to build a single education record from entities."""
    if degree_title is None:
        degree_title = extract_degree_field(entities, text)

    orgs = [
        e["text"] for e in entities
        if e["label"].lower() in ("school", "university", "organization", "company")
    ]
    locs = [e["text"] for e in entities if e["label"].lower() == "location"]

    if duration is None:
        duration = extract_date_range(entities, text)

    return {
        "title": degree_title,
        "institution": orgs[0] if orgs else None,
        "location": locs[0] if locs else None,
        "duration": duration,
        "description": clean_description(text),
    }


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
            exp_records.append(_build_experience_record(entities, text, None))
            continue

        # Create records for each job title
        for title_entity in title_entities:
            window_text, w_start, w_end = make_text_window(
                text,
                title_entity.get("start_char", -1),
                title_entity.get("end_char", -1),
            )

            local_entities = [e for e in entities if is_in_window(e, w_start, w_end)]

            # Try to get date from local entities first, fallback to all entities
            duration = extract_date_range(local_entities, window_text)
            if not duration:
                duration = extract_date_range(entities, text)

            exp_records.append(
                _build_experience_record(
                    local_entities,
                    window_text or text,
                    title_entity["text"].strip(),
                    duration,
                )
            )

    # Deduplicate by company, duration, and location
    return deduplicate_records(exp_records, ("company", "duration", "location"))


def _build_experience_record(
    entities: List[Dict],
    text: str,
    position: str = None,
    duration: str = None,
) -> Dict:
    """Helper to build a single experience record from entities."""
    locs = [e["text"] for e in entities if e["label"].lower() == "location"]
    orgs = [
        e["text"] for e in entities
        if e["label"].lower() in ("organization", "company")
    ]

    if duration is None:
        duration = extract_date_range(entities, text)

    return {
        "position": position,
        "company": orgs[0] if orgs else None,
        "location": locs[0] if locs else None,
        "duration": duration,
        "description": clean_description(text),
    }


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

    # Deduplicate by name
    return deduplicate_by_name(certs, "name")


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
