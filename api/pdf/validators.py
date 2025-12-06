"""
Regex validators for email, phone (Malaysia), degree, and date.
"""

import re
from typing import List, Optional, Tuple

from api.pdf.config import (
    EMAIL_PATTERN,
    PHONE_PATTERNS,
    DEGREE_PATTERNS,
    DATE_PATTERNS,
)


# =============================================================================
# Compiled Patterns
# =============================================================================

_EMAIL_RE = re.compile(EMAIL_PATTERN, re.IGNORECASE)
_PHONE_RES = [re.compile(p) for p in PHONE_PATTERNS]
_DEGREE_RES = [re.compile(p) for p in DEGREE_PATTERNS]
_DATE_RES = [re.compile(p) for p in DATE_PATTERNS]


# =============================================================================
# Email Validation
# =============================================================================

def is_valid_email(text: str) -> bool:
    """Check if text is a valid email address."""
    if not text:
        return False
    return bool(_EMAIL_RE.fullmatch(text.strip()))


def extract_emails(text: str) -> List[str]:
    """Extract all email addresses from text."""
    if not text:
        return []
    
    matches = _EMAIL_RE.findall(text)
    # Deduplicate while preserving order
    seen = set()
    result = []
    for email in matches:
        email_lower = email.lower()
        if email_lower not in seen:
            seen.add(email_lower)
            result.append(email)
    return result


def find_emails_with_positions(text: str) -> List[Tuple[str, int, int]]:
    """Find all emails with their start and end positions."""
    if not text:
        return []
    
    results = []
    for match in _EMAIL_RE.finditer(text):
        results.append((match.group(0), match.start(), match.end()))
    return results


# =============================================================================
# Phone Number Validation (Malaysia)
# =============================================================================

def normalize_phone(phone: str) -> str:
    """
    Normalize phone number by removing extra spaces and formatting.
    Keeps only digits and leading +.
    """
    if not phone:
        return ""
    
    # Keep + if it's at the start
    starts_with_plus = phone.strip().startswith('+')
    
    # Extract digits only
    digits = ''.join(c for c in phone if c.isdigit())
    
    if starts_with_plus:
        return '+' + digits
    return digits


def is_valid_malaysia_phone(text: str) -> bool:
    """Check if text is a valid Malaysia phone number."""
    if not text:
        return False
    
    normalized = normalize_phone(text)
    
    # Basic length check (Malaysia numbers are typically 10-12 digits)
    if len(normalized.replace('+', '')) < 9 or len(normalized.replace('+', '')) > 13:
        return False
    
    # Check against patterns
    for pattern in _PHONE_RES:
        if pattern.search(text):
            return True
    
    return False


def extract_phones(text: str) -> List[str]:
    """Extract all Malaysia phone numbers from text."""
    if not text:
        return []
    
    results = []
    seen = set()
    
    for pattern in _PHONE_RES:
        for match in pattern.finditer(text):
            phone = match.group(0).strip()
            normalized = normalize_phone(phone)
            
            if normalized not in seen:
                seen.add(normalized)
                results.append(phone)
    
    return results


def find_phones_with_positions(text: str) -> List[Tuple[str, int, int]]:
    """Find all phone numbers with their start and end positions."""
    if not text:
        return []
    
    results = []
    seen_positions = set()
    
    for pattern in _PHONE_RES:
        for match in pattern.finditer(text):
            pos = (match.start(), match.end())
            if pos not in seen_positions:
                seen_positions.add(pos)
                results.append((match.group(0), match.start(), match.end()))
    
    # Sort by position
    results.sort(key=lambda x: x[1])
    return results


# =============================================================================
# Degree Validation
# =============================================================================

def is_valid_degree(text: str) -> bool:
    """Check if text looks like a valid degree title."""
    if not text:
        return False
    
    text = text.strip()
    
    # Too short to be a degree
    if len(text) < 3:
        return False
    
    # Check against degree patterns
    for pattern in _DEGREE_RES:
        if pattern.search(text):
            return True
    
    return False


def validate_degree_text(text: str) -> Optional[str]:
    """
    Validate and clean degree text.
    Returns cleaned text if valid, None otherwise.
    """
    if not text:
        return None
    
    text = text.strip()
    
    # Check if it matches any degree pattern
    if not is_valid_degree(text):
        return None
    
    # Basic cleanup
    # Remove leading/trailing punctuation except parentheses
    text = re.sub(r'^[,.\s]+|[,.\s]+$', '', text)
    
    return text if text else None


# =============================================================================
# Date Validation
# =============================================================================

def is_valid_date(text: str) -> bool:
    """Check if text looks like a valid date or date indicator."""
    if not text:
        return False
    
    text = text.strip()
    
    # Check against date patterns
    for pattern in _DATE_RES:
        if pattern.search(text):
            return True
    
    return False


def validate_date_text(text: str) -> Optional[str]:
    """
    Validate and clean date text.
    Returns cleaned text if valid, None otherwise.
    """
    if not text:
        return None
    
    text = text.strip()
    
    # Check if it matches any date pattern
    if not is_valid_date(text):
        return None
    
    return text


def extract_date_range(text: str) -> Optional[Tuple[str, str]]:
    """
    Extract start and end dates from a date range string.
    Returns (start_date, end_date) or None if not a range.
    
    Examples:
    - "Jan 2020 - Dec 2023" -> ("Jan 2020", "Dec 2023")
    - "2020 - Present" -> ("2020", "Present")
    """
    if not text:
        return None
    
    # Split by common range separators
    range_separators = [' - ', ' – ', ' to ', ' TO ', '-', '–']
    
    for sep in range_separators:
        if sep in text:
            parts = text.split(sep, 1)
            if len(parts) == 2:
                start = parts[0].strip()
                end = parts[1].strip()
                
                if is_valid_date(start) and is_valid_date(end):
                    return (start, end)
    
    return None


def parse_date_text(text: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse date text and return (start_date, end_date).
    If only one date, returns (date, None).
    """
    if not text:
        return (None, None)
    
    # Try to extract as range first
    range_result = extract_date_range(text)
    if range_result:
        return range_result
    
    # Check if single valid date
    if is_valid_date(text):
        return (text.strip(), None)
    
    return (None, None)

