"""
Extract person information (name, email, phone, location) for redaction.
Supports multiple names, emails, phones, and locations.
Uses TextGroup.segments for coordinate data (no need for spaCy doc).
"""

import re
from typing import List, Set

from gliner import GLiNER

from api.pdf.models import (
    PersonInfo,
    RedactionRegion,
    TextGroup,
    TextSegment,
)
from api.pdf.validators import (
    extract_emails,
    extract_phones,
)


# =============================================================================
# Person Information Extraction
# =============================================================================

def extract_person_info(
    groups: List[TextGroup],
    gliner: GLiNER,
) -> PersonInfo:
    """
    Extract person information from resume groups.
    
    Extracts:
    - Names: Using GLiNER Person entity detection
    - Emails: Using regex pattern matching
    - Phones: Using regex pattern matching (Malaysia format)
    - Locations: Using GLiNER Location entity detection
    
    Also extracts redaction regions from TextGroup segments (which have bbox coords).
    
    Args:
        groups: List of TextGroup objects (classified, with segments containing bbox)
        gliner: GLiNER model instance
        
    Returns:
        PersonInfo object with all extracted information
    """
    # Get relevant groups for person info extraction
    person_groups = _get_person_groups(groups)
    
    # Combine text for NER extraction
    full_text = " ".join(g.text for g in person_groups)
    
    # Extract names and locations using GLiNER
    names, locations = _extract_names_and_locations(gliner, full_text)
    
    # Extract emails and phones using regex
    emails = extract_emails(full_text)
    phones = extract_phones(full_text)
    
    # Build redaction regions from segments
    redaction_regions = _find_redaction_regions(
        person_groups, names, emails, phones, locations
    )
    
    return PersonInfo(
        names=names,
        emails=emails,
        phones=phones,
        locations=locations,
        redaction_regions=redaction_regions,
    )


def _get_person_groups(groups: List[TextGroup]) -> List[TextGroup]:
    """
    Get groups that likely contain person info.
    Priority: PII sections > Summary > Unknown sections.
    
    Args:
        groups: List of TextGroup objects
        
    Returns:
        List of TextGroup objects to search for person info
    """
    result = []
    
    # Priority 1: Person sections
    for group in groups:
        if group.heading.lower() == "contact":
            result.append(group)
    
    # Priority 2: Summary sections
    for group in groups:
        if group.heading.lower() == "summary":
            result.append(group)
    
    # Priority 3: Unknown sections (often contain contact info at top of resume)
    for group in groups:
        if group.heading.lower() == "unknown":
            result.append(group)
    
    return result


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
# Redaction Region Extraction (using TextGroup.segments)
# =============================================================================

def _find_redaction_regions(
    groups: List[TextGroup],
    names: List[str],
    emails: List[str],
    phones: List[str],
    locations: List[str],
) -> List[RedactionRegion]:
    """
    Find redaction regions by searching TextGroup segments.
    Uses the bbox coordinates already stored in TextSegment.
    
    Args:
        groups: List of TextGroup objects with segments
        names: List of detected names
        emails: List of detected emails
        phones: List of detected phones
        locations: List of detected locations
        
    Returns:
        List of RedactionRegion objects
    """
    regions = []
    
    # Prepare search patterns
    name_tokens = _build_name_search_tokens(names)
    email_lowers = [e.lower() for e in emails]
    phone_digits = [_extract_digits(p) for p in phones if p]
    location_tokens = _build_location_search_tokens(locations)
    
    seen_regions: Set[tuple] = set()
    
    # Search through all segments in all groups
    for group in groups:
        for segment in group.segments:
            region = _check_segment_for_pii(
                segment,
                name_tokens,
                email_lowers,
                phone_digits,
                location_tokens,
                seen_regions,
            )
            if region:
                regions.append(region)
    
    return regions


def _check_segment_for_pii(
    segment: TextSegment,
    name_tokens: List[Set[str]],
    email_lowers: List[str],
    phone_digits: List[str],
    location_tokens: Set[str],
    seen_regions: Set[tuple],
) -> RedactionRegion | None:
    """
    Check if a segment contains PII and return a redaction region if so.
    
    Args:
        segment: TextSegment with text and bbox
        name_tokens: Tokenized names for matching
        email_lowers: Lowercase emails
        phone_digits: Phone numbers as digit strings
        location_tokens: Location tokens
        seen_regions: Set of already-seen region keys (for deduplication)
        
    Returns:
        RedactionRegion if PII found, None otherwise
    """
    if not segment.text or not segment.bbox:
        return None
    
    text_lower = segment.text.lower()
    segment_digits = _extract_digits(segment.text)
    
    info_type = None
    
    # Check for email
    for email in email_lowers:
        if email in text_lower:
            info_type = "email"
            break
    
    # Check for phone
    if not info_type:
        for phone_d in phone_digits:
            if phone_d and phone_d in segment_digits:
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
        return None
    
    # Use bbox from segment
    bbox = segment.bbox
    
    # Deduplicate by region key
    pad = 1.0
    region_key = (
        bbox.page_index,
        round(bbox.x0, 1),
        round(bbox.y0, 1),
        round(bbox.x1, 1),
        round(bbox.y1, 1),
    )
    
    if region_key in seen_regions:
        return None
    seen_regions.add(region_key)
    
    return RedactionRegion(
        page_index=bbox.page_index,
        bbox=(
            float(bbox.x0 - pad),
            float(bbox.y0 - pad),
            float(bbox.x1 + pad),
            float(bbox.y1 + pad),
        ),
        info_type=info_type,
    )


# =============================================================================
# Helper Functions
# =============================================================================

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
