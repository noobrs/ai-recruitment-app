"""
- run_segment_ner: single segment extraction wrapper
- run_full_resume_pipeline: process all segments
- extract_resume_entities: convenience function used by API
"""

from .ner_core import (
    extract_conll_entities, extract_skills_skillner, extract_email, extract_phone,
    extract_dates, extract_names, extract_degrees, extract_companies,
    extract_job_titles, apply_segment_filters
)
from .builder import build_final_response, normalize_output

def run_segment_ner(segment):
    text = segment.get("text", "") or ""
    label = segment.get("label", "") or ""

    conll = extract_conll_entities(text)
    skills = extract_skills_skillner(text)
    email = extract_email(text)
    phone = extract_phone(text)
    dates = extract_dates(text)
    names = extract_names(text)
    degrees = extract_degrees(text)
    companies = extract_companies(text, conll, label)
    job_titles = extract_job_titles(text, segment_label=label)
    result = {
        "segment_id": segment.get("segment_id"),
        "label": label,
        "names": names,
        "companies": companies,
        "locations": conll.get("LOC", []),
        "skills": skills,
        "job_titles": job_titles,
        "degrees": degrees,
        "emails": email,
        "phones": phone,
        "dates": dates,
        "raw_text": text
    }
    result = apply_segment_filters(result)
    return result

def run_full_resume_pipeline(classified_segments):
    cleaned_segments = []
    for seg in classified_segments:
        cleaned_segments.append(run_segment_ner(seg))
    # normalize_output returns a dict with name/email/skills/experience/education etc.
    normalized = normalize_output(cleaned_segments)
    return normalized

def extract_resume_entities(classified_segments):
    """
    API-facing helper: accepts classified_segments (from classify_segments)
    and returns final JSON (same structure as build_final_response)
    """
    normalized = run_full_resume_pipeline(classified_segments)
    final = build_final_response_from_normalized(normalized)
    return final

# internal helper to build response directly from normalized structure
def build_final_response_from_normalized(normalized):
    # keep builder logic small here - import builder function
    from .builder import build_final_response_from_normalized as bf
    return bf(normalized)
