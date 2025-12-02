"""
- normalize_output: the earlier normalization function (kept for backward compat)
- build_final_response: final API JSON format
"""

import re

import re

def clean_experience_description(text, job_titles=None, companies=None, dates=None, locations=None):
    if not text:
        return ""

    original = text

    # 1. Remove common section headers
    text = re.sub(r"\b(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)\b",
                  "", text, flags=re.I)

    # 2. Remove repeated job titles
    if job_titles:
        for t in job_titles:
            # Exact line removal
            text = re.sub(rf"^\s*{re.escape(t)}\s*$", "", text, flags=re.I | re.M)
            text = text.replace(t, "")

    # 3. Remove repeated company names
    if companies:
        for c in companies:
            text = re.sub(rf"^\s*{re.escape(c)}\s*$", "", text, flags=re.I | re.M)
            text = text.replace(c, "")

    # 4. Remove locations like "Miami, FL" or "New York"
    if locations:
        for loc in locations:
            if loc:
                text = text.replace(loc, "")

    text = re.sub(r"\b[A-Z][a-z]+,\s*[A-Z]{2}\b", "", text)  # Miami, FL pattern

    # 5. Remove all date formats
    all_date_patterns = [
        r"\b(19|20)\d{2}\b",                      # 2021
        r"\b(19|20)\d{2}\s*[-–/]\s*(19|20)\d{2}\b", # 2021–2023, 2019/2021
        r"\b(19|20)\d{2}\s*(present|current|now)\b", # 2021 present
        r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(19|20)\d{2}\b",  # Feb 2014
        r"\b(0[1-9]|[12][0-9]|3[01])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(19|20)\d{2}\b",  # 10 July 2022
        r"\b(0[1-9]|1[0-2])[-/](19|20)\d{2}\b",     # 03/2020
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)",
        r"Present|Current|Now"
    ]
    for p in all_date_patterns:
        text = re.sub(p, "", text, flags=re.I)

    # 6. Remove leading symbols
    text = re.sub(r"^[&*#\s]+", "", text, flags=re.M)

    # 7. Remove multiple blank lines
    text = re.sub(r"\n{2,}", "\n\n", text)

    # 8. Remove stray punctuation
    text = re.sub(r"[•·►●]+", "", text)

    # 9. Clean spaces
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def normalize_output(all_segments):
    """
    This is same as your previous normalize_output but returns normalized dict.
    """
    final = {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "summary": "",
        "skills": set(),
        "experience": [],
        "education": []
    }

    pi_emails = []
    pi_phones = []
    pi_locations = []

    for seg in all_segments:
        label = (seg.get("label") or "").lower()

        if label in ["sum","summary","about"]:
            final["summary"] += " " + (seg.get("raw_text") or "")

        for sk in seg.get("skills", []):
            if sk and len(sk) > 1:
                final["skills"].add(sk)

        if label == "pi":
            if seg.get("emails"): pi_emails.append(seg.get("emails"))
            if seg.get("phones"): pi_phones.append(seg.get("phones"))
            if seg.get("locations"): pi_locations.extend(seg.get("locations"))

        if label in ["exp","experience","internships"]:
            cleaned_desc = clean_experience_description(
                seg.get("raw_text") or "",
                job_titles=seg.get("job_titles", []),
                companies=seg.get("companies", []),
                dates=seg.get("dates", []),
                locations=seg.get("locations", []),
            )

            final["experience"].append({
                "title": seg.get("job_titles")[0] if seg.get("job_titles") else "",
                "company": seg.get("companies")[0] if seg.get("companies") else "",
                "location": seg.get("locations")[0] if seg.get("locations") else "",
                "start_date": seg.get("dates")[0] if seg.get("dates") else "",
                "end_date": seg.get("dates")[1] if len(seg.get("dates", [])) > 1 else "",
                "description": cleaned_desc
            })

        if label == "education":
            final["education"].append({
                "degree": seg.get("degrees")[0] if seg.get("degrees") else "",
                "major": "",
                "school": seg.get("companies")[0] if seg.get("companies") else "",
                "location": seg.get("locations")[0] if seg.get("locations") else "",
                "year": seg.get("dates")[0] if seg.get("dates") else ""
            })

        if seg.get("names") and not final["name"]:
            final["name"] = seg.get("names")[0]

    if pi_emails:
        final["email"] = pi_emails[0]
    if pi_phones:
        final["phone"] = pi_phones[0]
    if pi_locations:
        final["location"] = pi_locations[0]

    final["skills"] = sorted(list(final["skills"]))
    return final

def build_final_response_from_normalized(normalized):
    """
    Convert normalized dict to final schema required by you.
    """
    candidate_info = {
        "name": normalized.get("name", "") or "",
        "email": normalized.get("email", "") or "",
        "phone": normalized.get("phone", "") or "",
        "location": normalized.get("location", "") or "",
    }

    education_list = []
    for edu in normalized.get("education", []):
        education_list.append({
            "degree": edu.get("degree", "") or "",
            "institution": edu.get("school", "") or "",
            "location": edu.get("location", "") or "",
            "start_date": edu.get("year", "") or "",
            "end_date": "",
            "description": edu.get("school", "") or ""
        })

    experience_list = []
    for exp in normalized.get("experience", []):
        experience_list.append({
            "job_title": exp.get("title", "") or "",
            "company": exp.get("company", "") or "",
            "location": exp.get("location", "") or "",
            "start_date": exp.get("start_date", "") or "",
            "end_date": exp.get("end_date", "") or "",
            "description": exp.get("description", "") or "",
        })

    final_json = {
        "status": "success",
        "data": {
            "candidate": candidate_info,
            "education": education_list,
            "experience": experience_list,
            "skills": normalized.get("skills", []),
            "certifications": [],
            "activities": []
        }
    }
    return final_json

# convenience alias used by ner_pipeline
def build_final_response(normalized_or_segments):
    """
    Accept either:
    - normalized dict returned by normalize_output
    - OR list of segments -> will normalize then convert
    """
    if isinstance(normalized_or_segments, dict) and "skills" in normalized_or_segments:
        return build_final_response_from_normalized(normalized_or_segments)
    else:
        normalized = normalize_output(normalized_or_segments)
        return build_final_response_from_normalized(normalized)
