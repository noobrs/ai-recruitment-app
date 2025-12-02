"""
- normalize_output: the earlier normalization function (kept for backward compat)
- build_final_response: final API JSON format
"""

import re
import nltk

# Download once (safe to keep)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

def clean_experience_description(text, job_titles=None, companies=None, locations=None, dates=None):
    """
    1) Remove headers, job titles, companies, dates, locations.
    2) Collapse newlines to spaces (OCR joins).
    3) Split into sentence-like chunks by punctuation OR by capitalized sentence starts.
    4) Capitalize and ensure trailing punctuation.
    5) Return sentences joined with '\n' (one sentence per line).
    """
    if not text:
        return ""

    # --- 1) Pre-clean: headers, stray bullets, weird chars ---
    t = text

    # remove section headers
    t = re.sub(r"\b(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)\b", "", t, flags=re.I)

    # remove leading bullet characters on lines
    t = re.sub(r"^[\s•·\-*#&]+", "", t, flags=re.M)

    # remove explicit job titles / companies if provided (exact-line and inline)
    if job_titles:
        for jt in job_titles:
            if not jt: 
                continue
            # remove exact lines matching the job title
            t = re.sub(rf"(?m)^\s*{re.escape(jt)}\s*$", " ", t, flags=re.I)
            # remove inline occurrences (careful)
            t = re.sub(rf"\b{re.escape(jt)}\b", " ", t, flags=re.I)

    if companies:
        for c in companies:
            if not c:
                continue
            t = re.sub(rf"(?m)^\s*{re.escape(c)}\s*$", " ", t, flags=re.I)
            t = re.sub(rf"\b{re.escape(c)}\b", " ", t, flags=re.I)

    if locations:
        for loc in locations:
            if not loc:
                continue
            t = t.replace(loc, " ")

    # remove common "City, ST" patterns (Miami, FL)
    t = re.sub(r"\b[A-Z][a-z]+,\s*[A-Z]{2}\b", " ", t)

    # --- 2) Remove dates (year, month-year, month-present, month-month) BEFORE joining lines ---
    month = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)"
    year = r"(19[5-9]\d|20[0-4]\d|2050)"

    date_patterns = [
        rf"\b{month}\s+{year}\b",                     # Feb 2014
        rf"\b{month}\s*(?:[-–/]|to)\s*{month}\b",     # Feb–Oct, Feb to Oct (no years)
        rf"\b{month}\s*(?:[-–/]|to)\s*{month}\s+{year}\b", # Feb–Oct 2014
        rf"\b{year}\s*(?:[-–/\/to]+\s*{year})\b",     # 2011-2012, 2011/2012
        rf"\b{month}\s*(Present|Current|Now)\b",     # Feb Present
        rf"\b{month}\s*(?:[-–/]\s*)?(Present|Current|Now)\b", # Feb–Present
        rf"\b(?:[0-3]?\d[-/])?(?:0[1-9]|1[0-2])[-/](?:19|20)\d{2}\b", # 03/2020 or 3/2020
        rf"\b{year}\b",                                # lone years
        rf"\b(Present|Current|Now)\b"                   # lone Present
    ]
    for p in date_patterns:
        t = re.sub(p, " ", t, flags=re.I)

    # remove stray repeated punctuation / odd chars
    t = re.sub(r"[•·►●]+", " ", t)
    t = re.sub(r"[^\x00-\x7F]+", " ", t)  # remove non-ascii junk

    # --- 3) Collapse newlines into single spaces (preserve sentence continuity) ---
    t = re.sub(r"[\r\n]+", " ", t)
    t = re.sub(r"\s{2,}", " ", t).strip()

    if not t:
        return ""

    # --- 4) Split into sentence-like chunks ---
    # Strategy:
    #  - first capture real sentences that end with punctuation
    #  - then capture long sequences that likely are sentences but missing punctuation
    #  - split also at places where a capitalized word follows a space and previous char is lower-case (heuristic)
    sentences = []

    # a) Grab segments that end with sentence punctuation
    punct_sents = re.findall(r".+?[.!?](?:\s|$)", t)
    remainder = t
    if punct_sents:
        # collect and remove from remainder
        for s in punct_sents:
            s = s.strip()
            if s:
                sentences.append(s)
        # remove captured parts from remainder
        last_punct_end = 0
        for m in re.finditer(r".+?[.!?](?:\s|$)", t):
            last_punct_end = m.end()
        remainder = t[last_punct_end:].strip()

    # b) Process remainder by heuristics (split where Capitalized word suggests new sentence)
    if remainder:
        # split on " <CapitalLetter><lower>" markers but avoid splitting acronyms
        parts = re.split(r"(?<=\w)\s+(?=[A-Z][a-z]{2,})", remainder)
        for p in parts:
            p = p.strip()
            if p:
                sentences.append(p)

    # If we didn't capture any punctuation-based sentences (common with OCR),
    # fallback: split by length chunks separated by comma/semicolon then treat them as sentences.
    if not sentences:
        # split by common punctuation and " and " / " then "
        fallback_parts = re.split(r"[;•\-–—\—]+|\band\b|\bthen\b", t, flags=re.I)
        for p in fallback_parts:
            p = p.strip()
            if p:
                sentences.append(p)

    # --- 5) Clean & normalise sentences: capitalise first char, ensure final punctuation ---
    clean_sents = []
    for s in sentences:
        # remove leading/trailing stray punctuation/spaces
        s = s.strip(" \t\n\r\ufeff\u200b-–—:;,.")
        if not s:
            continue

        # lower-case accidental ALL-CAPS words but keep proper nouns
        # (simple heuristic: if most letters uppercase, lower them)
        letters = re.sub(r"[^A-Za-z]", "", s)
        if letters and sum(1 for ch in letters if ch.isupper()) / max(1, len(letters)) > 0.6:
            s = s.lower()

        # ensure first char capitalised
        s = s[0].upper() + s[1:] if len(s) > 1 else s.upper()
        
        # ensure it ends with a period
        if not s.endswith((".", "!", "?")):
            s = s + "."

        clean_sents.append(s)

    # --- 6) Join with newline, one sentence per line as requested ---
    result = "\n".join(clean_sents)
    return result


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
