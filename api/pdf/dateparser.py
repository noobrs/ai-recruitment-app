import re

RANGE_SPLIT_RE = re.compile(r"\s*(?:-|–|—|to|until|till|through)\s*", re.IGNORECASE)

from dateutil import parser as date_parser

def parse_fuzzy_date(text: str):
    """
    Best-effort parse of a date string.
    Returns a date (not datetime) or None.
    """
    if not text:
        return None
    try:
        dt = date_parser.parse(text, fuzzy=True, default=None)
        return dt.date()
    except Exception:
        return None


def parse_date_range_raw(text: str):
    """
    Parse a date range string into (start_date, end_date, is_present_end).
    end_date is None when it's something like 'Present' / 'Current'.
    """
    if not text:
        return None, None, False

    parts = RANGE_SPLIT_RE.split(text)
    if len(parts) != 2:
        # Not a clear range, treat as single date
        start = parse_fuzzy_date(text)
        return start, None, False

    raw_start, raw_end = parts[0].strip(), parts[1].strip()

    # Handle 'Present' / 'Current' / 'Now'
    if re.search(r"\b(present|current|now|today)\b", raw_end, re.IGNORECASE):
        start = parse_fuzzy_date(raw_start)
        return start, None, True

    start = parse_fuzzy_date(raw_start)
    end = parse_fuzzy_date(raw_end)
    return start, end, False

def extract_date_range(text: str):
    # optionally keep DATE_RANGE_RE as a *hint*, but fall back to the whole text
    from api.pdf.regexes import DATE_RANGE_RE  # if you still want it

    m = DATE_RANGE_RE.search(text)
    raw = m.group(0) if m else text
    start, end, is_present = parse_date_range_raw(raw)
    return {
        "raw": raw,
        "start": start,      # date or None
        "end": end,          # date or None
        "is_present": is_present,
    }


__all__ = [
    "parse_fuzzy_date",
    "parse_date_range_raw",
    "extract_date_range",
]