"""
Utility functions for PDF resume extraction pipeline.
"""

import re
from typing import Dict, List, Optional, Tuple

from rapidfuzz import fuzz

from api.pdf.models import Entity


# =============================================================================
# Text Normalization
# =============================================================================

def normalize_text(text: Optional[str]) -> str:
    """Normalize text by stripping whitespace and collapsing spaces."""
    if not text:
        return ""
    return " ".join(text.strip().split())


def normalize_key(s: str) -> str:
    """
    Normalize a string for use as a dictionary key.
    Strips whitespace, collapses spaces, lowercases.
    """
    return " ".join((s or "").strip().split()).lower()


# =============================================================================
# String Similarity
# =============================================================================

def is_similar(a: str, b: str, threshold: int = 92) -> bool:
    """
    Check if two strings are similar using fuzzy matching.
    Used for deduplication.
    
    Args:
        a: First string
        b: Second string
        threshold: Similarity threshold (0-100)
        
    Returns:
        True if strings are similar enough
    """
    return fuzz.token_sort_ratio(a, b) >= threshold


# =============================================================================
# Duration/Date Parsing
# =============================================================================

def split_duration(duration: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Split duration string like 'Jan 2020 - Present' into (start_date, end_date).
    
    Args:
        duration: Duration string
        
    Returns:
        Tuple of (start_date, end_date)
    """
    if not duration:
        return None, None
    
    # Try various separators
    separators = [r"\s*[-–]\s*", r"\s+to\s+", r"\s+TO\s+"]
    
    for sep in separators:
        parts = re.split(sep, duration)
        if len(parts) == 2:
            start = parts[0].strip() or None
            end = parts[1].strip() or None
            return start, end
    
    return duration.strip(), None


# =============================================================================
# Description Cleaning
# =============================================================================

def clean_description(text: str) -> str:
    """
    Clean description text by:
    - Removing bullet points
    - Removing empty lines
    - Collapsing multiple spaces
    
    Args:
        text: Raw description text
        
    Returns:
        Cleaned description
    """
    if not text:
        return ""
    
    bullet_re = re.compile(r"^[\s\u2022\u2023\u25E6\u2043\-\*•]+")
    multi_space_re = re.compile(r"\s+")
    
    lines = []
    for line in text.splitlines():
        line = bullet_re.sub("", line).strip()
        if line:
            lines.append(line)
    
    if not lines:
        return ""
    
    cleaned = " ".join(lines)
    cleaned = multi_space_re.sub(" ", cleaned).strip()
    return cleaned


def remove_fields_from_description(
    text: str,
    fields_to_remove: List[str],
) -> str:
    """
    Remove duplicate content from description that appears in other fields.
    Removes both entire lines that match and inline occurrences of field values.
    
    Args:
        text: Description text
        fields_to_remove: List of field values to remove (title, company, etc.)
        
    Returns:
        Cleaned description with duplicates removed
    """
    if not text:
        return ""
    
    if not fields_to_remove:
        return clean_description(text)
    
    # First pass: Remove inline occurrences of fields from the text
    result_text = text
    
    # Sort fields by length (longest first) to avoid partial matches
    sorted_fields = sorted(
        [f for f in fields_to_remove if f and str(f).strip()],
        key=lambda x: len(str(x)),
        reverse=True
    )
    
    for field in sorted_fields:
        field_str = str(field).strip()
        if not field_str or len(field_str) < 2:
            continue
        
        # Escape special regex characters
        escaped_field = re.escape(field_str)
        
        # Pattern to match the field with optional surrounding separators/parentheses
        # Handles cases like: "Intern)", "| November 2023 - January 2024", "(Honours)"
        patterns = [
            # Field with optional closing paren/bracket before it
            # rf"[\)\]]*\s*{escaped_field}\s*[\(\[]*",
            # Field surrounded by separators like |, -, :
            rf"[\|\-–:,]*\s*{escaped_field}\s*[\|\-–:,]*",
            # Just the field with surrounding whitespace
            rf"\s*{escaped_field}\s*",
        ]
        
        for pattern in patterns:
            result_text = re.sub(pattern, " ", result_text, flags=re.IGNORECASE)
    
    # Clean up leftover separators and punctuation artifacts
    # Remove orphaned separators like " | ", " - ", " : " etc.
    result_text = re.sub(r"\s*[\|\-–]+\s*[\|\-–]+\s*", " ", result_text)
    result_text = re.sub(r"^\s*[\|\-–:,]+\s*", "", result_text)
    result_text = re.sub(r"\s*[\|\-–:,]+\s*$", "", result_text)
    result_text = re.sub(r"\s*[\|\-–]+\s*$", "", result_text)
    result_text = re.sub(r"^\s*[\|\-–]+\s*", "", result_text)
    
    # Remove empty parentheses
    result_text = re.sub(r"\(\s*\)", "", result_text)
    result_text = re.sub(r"\[\s*\]", "", result_text)
    
    # Remove orphaned closing parentheses/brackets at start (e.g., "Intern) ..." -> "...")
    result_text = re.sub(r"^\s*[\)\]]+\s*", "", result_text)
    
    # Remove orphaned opening parentheses/brackets at end
    result_text = re.sub(r"\s*[\(\[]+\s*$", "", result_text)
    
    # Clean up orphaned short parenthetical content at the start
    # e.g., "(Honours) CGPA: 3.95..." -> "CGPA: 3.95..."
    result_text = re.sub(r"^\s*\([A-Za-z\s]{1,20}\)\s*", "", result_text)
    
    # Second pass: Line-by-line filtering for remaining matches
    lines = [line.strip() for line in result_text.splitlines() if line.strip()]
    filtered_lines = []
    
    for line in lines:
        line_normalized = normalize_text(line)
        should_skip = False
        
        # Skip very short lines (likely just leftover separators)
        if len(line_normalized) < 3:
            should_skip = True
        
        if not should_skip:
            for field in sorted_fields:
                field_normalized = normalize_text(str(field))
                
                # Skip if line is exactly the field
                if field_normalized == line_normalized:
                    should_skip = True
                    break
                
                # Skip if high similarity (>85%)
                if len(field_normalized) > 10 and is_similar(line_normalized, field_normalized, threshold=85):
                    should_skip = True
                    break
        
        if not should_skip:
            filtered_lines.append(line)
    
    result = " ".join(filtered_lines)
    return clean_description(result)


# =============================================================================
# Deduplication
# =============================================================================

def deduplicate_by_key(
    records: List[Dict],
    key_fields: Tuple[str, ...],
    prefer_longer_description: bool = True,
) -> List[Dict]:
    """
    Deduplicate records based on key fields.
    
    Args:
        records: List of record dicts
        key_fields: Tuple of field names to use as deduplication key
        prefer_longer_description: If True, keep record with longer description
        
    Returns:
        Deduplicated list of records
    """
    unique_map: Dict[tuple, Dict] = {}
    
    for rec in records:
        key = tuple(rec.get(field) for field in key_fields)
        
        if key not in unique_map:
            unique_map[key] = rec
        elif prefer_longer_description:
            existing_len = len(unique_map[key].get("description") or "")
            new_len = len(rec.get("description") or "")
            if new_len > existing_len:
                unique_map[key] = rec
    
    return list(unique_map.values())


# =============================================================================
# Entity Helpers
# =============================================================================

def get_entity_texts(
    entities: List[Entity],
    label: str,
) -> List[str]:
    """Get all entity texts for a specific label, sorted by score."""
    matching = [e for e in entities if e.label.lower() == label.lower()]
    matching.sort(key=lambda e: e.score, reverse=True)
    return [e.text for e in matching]


def extract_date_from_entities(
    entities: List[Entity],
    fallback_text: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract start and end dates from Date entities.
    Falls back to regex extraction if GLiNER misses dates like "Present".
    
    Args:
        entities: List of entities
        fallback_text: Optional text to search for dates if entities are incomplete
        
    Returns:
        Tuple of (start_date, end_date)
    """
    from api.pdf.validators import _DATE_RES
    
    date_entities = [e for e in entities if e.label.lower() == "date"]
    
    # Sort by position in document
    if date_entities:
        date_entities.sort(key=lambda e: e.start_char if e.start_char >= 0 else 999999)
    
    # Try to extract from entities first
    start_from_entities = None
    end_from_entities = None
    
    if len(date_entities) >= 2:
        start_from_entities = date_entities[0].text.strip()
        end_from_entities = date_entities[1].text.strip()
    elif len(date_entities) == 1:
        date_text = date_entities[0].text.strip()
        # Check if it contains a range
        start, end = split_duration(date_text)
        if start and end:
            return start, end
        start_from_entities = date_text
    
    # If we have complete dates from entities, return them
    if start_from_entities and end_from_entities:
        return start_from_entities, end_from_entities
    
    # Otherwise, use regex fallback to find missing dates (especially "Present")
    if fallback_text:
        found_dates = []
        present_like_dates = []
        
        for pattern in _DATE_RES:
            matches = pattern.findall(fallback_text)
            for match in matches:
                match_lower = match.strip().lower()
                # Separate "Present" like keywords
                if match_lower in ['present', 'current', 'now', 'ongoing']:
                    present_like_dates.append(match.strip())
                else:
                    found_dates.append(match.strip())
        
        # Remove duplicates while preserving order
        def dedupe(dates):
            seen = set()
            unique = []
            for date in dates:
                date_normalized = date.strip().lower()
                if date_normalized not in seen:
                    seen.add(date_normalized)
                    unique.append(date.strip())
            return unique
        
        found_dates = dedupe(found_dates)
        present_like_dates = dedupe(present_like_dates)
        
        # If we have a start date from entities and found a "Present" keyword
        if start_from_entities and present_like_dates:
            return start_from_entities, present_like_dates[0]
        
        # If we have start from entities and found another date
        if start_from_entities and found_dates:
            # Check if any found date is different from start
            for date in found_dates:
                if date.lower() != start_from_entities.lower():
                    # Use this as end date, but prefer "Present" if available
                    if present_like_dates:
                        return start_from_entities, present_like_dates[0]
                    return start_from_entities, date
        
        # Combine all found dates for complete fallback
        all_dates = found_dates + present_like_dates
        
        if len(all_dates) >= 2:
            return all_dates[0], all_dates[1]
        elif len(all_dates) == 1:
            # Check if single date contains a range
            start, end = split_duration(all_dates[0])
            if start and end:
                return start, end
            return all_dates[0], None
    
    # Return whatever we found from entities (might be incomplete)
    return start_from_entities, end_from_entities

