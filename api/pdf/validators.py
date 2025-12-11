"""
Regex validators for email, phone (Malaysia), degree, and date.
"""

import re
from typing import List

from api.pdf.config import (
    EMAIL_PATTERN,
    DEGREE_PATTERNS,
    DATE_PATTERNS,
)


# =============================================================================
# Compiled Patterns
# =============================================================================

_EMAIL_RE = re.compile(EMAIL_PATTERN, re.IGNORECASE)
_DEGREE_RES = [re.compile(p, re.IGNORECASE) for p in DEGREE_PATTERNS]
_DATE_RES = [re.compile(p, re.IGNORECASE) for p in DATE_PATTERNS]


# =============================================================================
# Email Validation
# =============================================================================

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