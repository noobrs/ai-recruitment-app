"""
Extract person information (name, email, phone, location) for redaction.
Supports multiple names, emails, phones, and locations.
"""

import re
from typing import Any, List, Optional, Set

from gliner import GLiNER

from api.pdf.config import PERSON_SECTION_MAX_CHARS
from api.pdf.models import (
    BoundingBox,
    PersonInfo,
    RedactionRegion,
    TextGroup,
)
from api.pdf.validators import (
    extract_emails,
    extract_phones,
    find_emails_with_positions,
    find_phones_with_positions,
)
from api.pdf.layout_parser import extract_bbox


# =============================================================================
# Person Information Extraction
# =============================================================================

def extract_person_info(
    groups: List[TextGroup],
    gliner: GLiNER,
    doc: Optional[Any] = None,
) -> PersonInfo:
    """
    Extract person information from resume groups.
    
    Extracts:
    - Names: Using GLiNER Person entity detection
    - Emails: Using regex pattern matching
    - Phones: Using regex pattern matching (Malaysia format)
    - Locations: Using GLiNER Location entity detection
    
    Also extracts redaction regions for each piece of information.
    
    Args:
        groups: List of TextGroup objects (classified)
        gliner: GLiNER model instance
        doc: Optional spaCy Doc with layout info (for coordinate extraction)
        
    Returns:
        PersonInfo object with all extracted information
    """
    # Combine text from groups, prioritizing person/summary sections and top of document
    full_text = _get_person_section_text(groups)
    
    # Extract names and locations using GLiNER
    names, locations = _extract_names_and_locations(gliner, full_text)
    
    # Extract emails and phones using regex
    emails = extract_emails(full_text)
    phones = extract_phones(full_text)
    
    # Build redaction regions if doc is provided
    redaction_regions = []
    if doc is not None:
        redaction_regions = _find_redaction_regions(
            doc, names, emails, phones, locations
        )
    
    return PersonInfo(
        names=names,
        emails=emails,
        phones=phones,
        locations=locations,
        redaction_regions=redaction_regions,
    )


def _get_person_section_text(groups: List[TextGroup]) -> str:
    """
    Get text content for person info extraction.
    Prioritizes:
    1. Sections classified as 'person'
    2. Sections classified as 'summary'
    3. NO_HEADING sections
    
    Args:
        groups: List of TextGroup objects
        
    Returns:
        Combined text for person info extraction
    """
    texts = []
    
    # Priority 1: Person sections
    for group in groups:
        if group.section_type == "person":
            texts.append(group.text)
    
    # Priority 2: Summary sections
    for group in groups:
        if group.section_type == "summary":
            texts.append(group.text)
    
    # Priority 3: NO_HEADING sections (often contain contact info)
    for group in groups:
        if group.heading == "NO_HEADING":
            texts.append(group.text)
    
    # # Priority 4: Other sections (limited amount)
    # remaining_chars = PERSON_SECTION_MAX_CHARS - sum(len(t) for t in texts)
    # if remaining_chars > 0:
    #     for group in groups:
    #         if group.section_type not in ("person", "summary") and group.heading != "NO_HEADING":
    #             if remaining_chars > 0:
    #                 texts.append(group.text[:remaining_chars])
    #                 remaining_chars -= len(group.text)
    
    combined = "\n".join(texts)
    # return combined[:PERSON_SECTION_MAX_CHARS]
    return combined


def _extract_names_and_locations(
    gliner: GLiNER,
    text: str,
) -> tuple[List[str], List[str]]:
    """
    Extract person names and locations from text using GLiNER.
    
    Args:
        gliner: GLiNER model instance
        text: Text to extract from
        
    Returns:
        Tuple of (names list, locations list)
    """
    if not text:
        return [], []
    
    try:
        entities = gliner.predict_entities(
            text,
            ["Person", "Location"],
            threshold=0.45,
        )
    except Exception:
        return [], []
    
    names = []
    locations = []
    seen_names: Set[str] = set()
    seen_locations: Set[str] = set()
    
    for entity in entities:
        label = (entity.get("label") or "").lower()
        text_val = (entity.get("text") or "").strip()
        
        if not text_val or len(text_val) < 2:
            continue
        
        # Skip if looks like an email
        if "@" in text_val:
            continue
        
        if label == "person":
            # Validate: should be a reasonable name
            if _is_valid_name(text_val):
                key = text_val.lower()
                if key not in seen_names:
                    seen_names.add(key)
                    names.append(text_val)
        
        elif label == "location":
            key = text_val.lower()
            if key not in seen_locations:
                seen_locations.add(key)
                locations.append(text_val)
    
    return names, locations


def _is_valid_name(text: str) -> bool:
    """Check if text looks like a valid person name."""
    if not text or len(text) < 2:
        return False
    
    # Names shouldn't be too long
    if len(text) > 50:
        return False
    
    # Should contain at least some letters
    if not any(c.isalpha() for c in text):
        return False
    
    # Shouldn't contain digits
    digit_count = sum(1 for c in text if c.isdigit())
    if digit_count > 1:
        return False
    
    # Shouldn't contain @ or other special characters
    if any(c in text for c in "@#$%^&*()=+[]{}|\\<>"):
        return False
    
    return True


# =============================================================================
# Redaction Region Extraction
# =============================================================================

def _find_redaction_regions(
    doc: Any,
    names: List[str],
    emails: List[str],
    phones: List[str],
    locations: List[str],
) -> List[RedactionRegion]:
    """
    Find layout spans containing person info and return redaction regions.
    
    Args:
        doc: spaCy Doc with layout info
        names: List of detected names
        emails: List of detected emails
        phones: List of detected phones
        locations: List of detected locations
        
    Returns:
        List of RedactionRegion objects
    """
    regions = []
    
    if doc is None or not hasattr(doc, "spans"):
        return regions
    
    try:
        layout_spans = doc.spans.get("layout", [])
    except Exception:
        return regions
    
    if not layout_spans:
        return regions
    
    # Prepare search patterns
    name_tokens = _build_name_search_tokens(names)
    email_lowers = [e.lower() for e in emails]
    phone_digits = [_extract_digits(p) for p in phones if p]
    location_tokens = _build_location_search_tokens(locations)
    
    seen_regions: Set[tuple] = set()
    
    for span in layout_spans:
        raw_text = span.text or ""
        if not raw_text.strip():
            continue
        
        text_lower = raw_text.lower()
        span_digits = _extract_digits(raw_text)
        
        info_type = None
        
        # Check for email
        for email in email_lowers:
            if email in text_lower:
                info_type = "email"
                break
        
        # Check for phone
        if not info_type:
            for phone_d in phone_digits:
                if phone_d and phone_d in span_digits:
                    info_type = "phone"
                    break
        
        # Check for name (all tokens must be present)
        if not info_type:
            for name_token_set in name_tokens:
                if all(token in text_lower for token in name_token_set):
                    info_type = "name"
                    break
        
        # Check for location
        if not info_type:
            for loc_token in location_tokens:
                if loc_token in text_lower:
                    info_type = "location"
                    break
        
        if not info_type:
            continue
        
        # Extract bounding box
        layout_obj = getattr(span._, "layout", None)
        bbox = extract_bbox(layout_obj)
        if bbox is None:
            continue
        
        # Apply padding
        pad = 1.0
        region_key = (
            bbox.page_index,
            round(bbox.x0, 1),
            round(bbox.y0, 1),
            round(bbox.x1, 1),
            round(bbox.y1, 1),
        )
        
        if region_key in seen_regions:
            continue
        seen_regions.add(region_key)
        
        regions.append(RedactionRegion(
            page_index=bbox.page_index,
            bbox=(
                float(bbox.x0 - pad),
                float(bbox.y0 - pad),
                float(bbox.x1 + pad),
                float(bbox.y1 + pad),
            ),
            info_type=info_type,
        ))
    
    return regions


def _build_name_search_tokens(names: List[str]) -> List[Set[str]]:
    """Build search token sets for each name."""
    result = []
    for name in names:
        tokens = set()
        for token in re.split(r"\s+", name):
            token = token.strip().lower()
            if token and len(token) >= 2:
                tokens.add(token)
        if tokens:
            result.append(tokens)
    return result


def _build_location_search_tokens(locations: List[str]) -> Set[str]:
    """Build search tokens for locations."""
    tokens = set()
    for loc in locations:
        for token in re.split(r"[,\s]+", loc):
            token = token.strip().lower()
            if token and len(token) >= 3:
                tokens.add(token)
    return tokens


def _extract_digits(text: str) -> str:
    """Extract only digits from text."""
    return "".join(c for c in text if c.isdigit())

