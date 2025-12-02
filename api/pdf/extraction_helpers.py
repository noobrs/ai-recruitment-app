"""
Common helper functions for extracting structured data from resume sections.
"""

from typing import Dict, List, Optional

from api.pdf.utils import normalize_key


def extract_entities_by_label(
    groups: List[Dict],
    target_label: str,
    skip_no_heading: bool = True,
) -> List[str]:
    """
    Extract and aggregate entities of a specific label from groups.

    Args:
        groups: List of classified section groups
        target_label: Entity label to extract (e.g., 'skill', 'language')
        skip_no_heading: Whether to skip NO_HEADING groups

    Returns:
        List of entity texts, sorted by confidence score (highest first)
    """
    from api.pdf.utils import update_best_score

    best_scores: Dict[str, float] = {}

    for group in groups:
        # Skip NO_HEADING groups if requested
        if skip_no_heading and group.get("heading") == "NO_HEADING":
            continue

        # Get entities from this group
        entities = group.get("entities", [])

        for entity in entities:
            label = entity["label"].lower()
            if label == target_label.lower():
                update_best_score(best_scores, entity["text"], entity["score"])

    # Return sorted by score
    items = sorted(best_scores.items(), key=lambda kv: kv[1], reverse=True)
    return [text for text, _ in items]


def extract_date_range(entities: List[Dict], text: str = "") -> Optional[str]:
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


def extract_degree_field(entities: List[Dict], text: str = "") -> Optional[str]:
    """
    Extract degree field/major from Degree entities.
    Falls back to first degree entity if found.
    """
    degree_entities = [e for e in entities if e["label"].lower() == "degree"]
    if degree_entities:
        # Return the first degree text
        return degree_entities[0]["text"].strip()
    return None


def deduplicate_records(
    records: List[Dict],
    key_fields: tuple,
    prefer_longer_description: bool = True,
) -> List[Dict]:
    """
    Deduplicate records based on key fields.

    Args:
        records: List of record dicts to deduplicate
        key_fields: Tuple of field names to use as deduplication key
        prefer_longer_description: If True, keep record with longer description when duplicates found

    Returns:
        List of unique records
    """
    unique_map = {}

    for rec in records:
        # Create key from specified fields
        key = tuple(rec.get(field) for field in key_fields)

        if key not in unique_map:
            unique_map[key] = rec
        else:
            if prefer_longer_description:
                # Keep the record with the longer description
                existing_desc_len = len(unique_map[key].get("description") or "")
                new_desc_len = len(rec.get("description") or "")
                if new_desc_len > existing_desc_len:
                    unique_map[key] = rec

    return list(unique_map.values())


def deduplicate_by_name(items: List[Dict], name_field: str = "name") -> List[Dict]:
    """
    Deduplicate items by normalizing the name field.

    Args:
        items: List of dicts with a name field
        name_field: Name of the field to use for deduplication

    Returns:
        List of unique items
    """
    unique = []
    seen = set()

    for item in items:
        name = item.get(name_field, "")
        key = normalize_key(name)

        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique
