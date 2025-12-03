"""
Extract candidate contact information (name, email, phone, location) from resume text.
"""

import re
from typing import Dict, List, Optional, Any

from gliner import GLiNER

from api.pdf.layout_parser import extract_bbox


# Contact information patterns
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_RE = re.compile(r"(?:\+60|01\d)[\d\s\-()]{7,}")


def _find_closest_item(
    items: List[str],
    anchor_pos: int,
    full_text: str,
    used_indices: set,
) -> Optional[tuple[int, str]]:
    """
    Find the closest unused item to an anchor position in text.

    Returns:
        Tuple of (index, item_text) or None if no unused items found
    """
    closest = None
    min_dist = float('inf')

    for i, item in enumerate(items):
        if i not in used_indices:
            item_pos = full_text.find(item)
            if item_pos != -1:
                dist = abs(item_pos - anchor_pos)
                if dist < min_dist:
                    min_dist = dist
                    closest = (i, item)

    return closest


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

        # Find closest email, phone, and location using helper
        closest_email = _find_closest_item(emails, name_pos, full_text, used_emails)
        closest_phone = _find_closest_item(phones, name_pos, full_text, used_phones)

        # For locations, we need to extract from entity objects
        location_items = [loc["text"].strip() for loc in locations]
        closest_location_idx = _find_closest_item(location_items, name_pos, full_text, used_locations)

        # Extract values and mark as used
        email_text = None
        if closest_email:
            used_emails.add(closest_email[0])
            email_text = closest_email[1]

        phone_text = None
        if closest_phone:
            used_phones.add(closest_phone[0])
            phone_text = closest_phone[1]

        location_text = None
        if closest_location_idx:
            used_locations.add(closest_location_idx[0])
            location_text = closest_location_idx[1]

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
