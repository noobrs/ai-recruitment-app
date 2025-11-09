import re
from transformers import pipeline

# =========================
# Load Transformer NER (No SpaCy)
# =========================
ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple",
    device=-1  # CPU; set device=0 if CUDA is available
)

# =========================
# Load Skills Dictionary
# =========================
with open("data/skills.txt", "r", encoding="utf-8") as f:
    SKILLS = [line.strip().lower() for line in f if line.strip()]
SKILLS = sorted(set(SKILLS))

# =========================
# Regex Patterns
# =========================
EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}"
PHONE_PATTERN = r"(\+?\d[\d\s\-]{6,}\d)"
LINK_PATTERN = r"(https?://\S+|linkedin\.com\S+|github\.com\S+|facebook\.com\S+|twitter\.com\S+)"
PERCENT_PATTERN = r"\b\d{1,3}%\b"
DATE_PATTERN = r"\b(?:19|20)\d{2}\b"
DATE_RANGE_PATTERN = r"\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:19|20)\d{2}\b"

# =========================
# Helper Functions
# =========================
def safe_get_first(lst):
    return lst[0] if lst else None

def safe_get_last(lst):
    return lst[-1] if lst else None

def extract_skills_from_text(text):
    """Match skills by dictionary."""
    text_lower = text.lower()
    found = [skill for skill in SKILLS if re.search(r"\b" + re.escape(skill) + r"\b", text_lower)]
    return sorted(set(found))

def clean_orgs(orgs):
    """Filter realistic org names."""
    return [o.strip() for o in orgs if len(o.split()) <= 6 and re.search(r"[A-Za-z]", o)]

def clean_institutions(orgs):
    """Filter likely educational institutions."""
    return [o for o in orgs if re.search(r"(university|college|institute|school)", o.lower())]

def clean_certifications(text):
    """Extract certifications and licenses."""
    certs = re.findall(r"(certified[\w\s\-()]+|certificate[\w\s\-()]+|licen[cs]e[\w\s\-()]+)", text, flags=re.I)
    return [c.strip() for c in certs]

def extract_titles(text):
    """Detect job titles by capitalization."""
    pattern = r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b"
    titles = [t for t in re.findall(pattern, text) if len(t.split()) > 1]
    return list(set(titles))

# =========================
# Label Normalization
# =========================
def normalize_label(label, text):
    text_upper = text.strip().upper()
    if text_upper.startswith("SKILLS"):
        return "skills"
    if text_upper.startswith("ACTIVITIES"):
        return "activities"
    if text_upper.startswith("EDUCATION"):
        return "education"
    if text_upper.startswith("LICENSES") or text_upper.startswith("CERTIFICATIONS"):
        return "certifications"
    if text_upper.startswith("WORK EXPERIENCE") or text_upper.startswith("EXPERIENCE"):
        return "experience"
    return label.lower()

# =========================
# Entity Normalization
# =========================
def normalize_entities(seg_label, text, ents):
    text = re.sub(r"\s+", " ", text)
    seg_label = seg_label.lower()

    result = {
        "emails": re.findall(EMAIL_PATTERN, text),
        "phones": re.findall(PHONE_PATTERN, text),
        "links": re.findall(LINK_PATTERN, text),
        "percents": re.findall(PERCENT_PATTERN, text),
        "years": re.findall(DATE_PATTERN, text),
        "year_ranges": re.findall(DATE_RANGE_PATTERN, text),
        "skills": extract_skills_from_text(text)
    }

    # Extracted Transformer entities
    orgs = [t for t, l in ents if l == "ORG"]
    locations = [t for t, l in ents if l in ["LOC", "GPE"]]
    persons = [t for t, l in ents if l in ["PER", "PERSON"]]
    dates = [t for t, l in ents if l == "DATE"]

    if seg_label in ["experience", "exp", "employment"]:
        result.update({
            "companies": clean_orgs(orgs),
            "roles": extract_titles(text),
            "dates": dates,
            "locations": locations
        })

    elif seg_label in ["education", "edu"]:
        result.update({
            "institutions": clean_institutions(orgs),
            "degrees": [s for s in result["skills"]
                        if any(d in s.lower() for d in ["bachelor", "master", "phd", "mba", "diploma"])],
            "dates": dates,
            "locations": locations
        })

    elif seg_label == "skills":
        result["skills"] = list(set(result["skills"] + orgs))

    elif seg_label in ["certifications", "licenses"]:
        result["certifications"] = clean_certifications(text)

    elif seg_label == "contact":
        result.update({
            "names": persons,
            "locations": locations,
            "orgs": clean_orgs(orgs)
        })

    elif seg_label in ["summary", "objective"]:
        result["keywords"] = extract_skills_from_text(text)

    return result

# =========================
# Transformer-based NER Runner
# =========================
def run_transformer_ner(segment_dict):
    results = {}
    for seg_id, (label, text) in segment_dict.items():
        entities = ner_pipeline(text)
        ents = [(e["word"], e["entity_group"]) for e in entities]
        results[seg_id] = {
            "label": label,
            "text": text,
            "entities": normalize_entities(label, text, ents)
        }
    return results

# =========================
# Resume JSON Builder
# =========================
def build_resume_json_v2(classified_segments, hybrid_results, SKILLS):
    all_text = " ".join(seg["text"] for seg in classified_segments if seg["text"])

    resume = {
        "candidate": {"name": None, "email": None, "phone": None, "location": None},
        "education": [],
        "experience": [],
        "skills": [],
        "certifications": [],
        "activities": []
    }

    JOB_TITLES = ["nurse", "engineer", "developer", "manager", "assistant",
                  "analyst", "consultant", "technician"]

    for seg in classified_segments:
        seg_id = seg["segment_id"]
        text = seg["text"]
        ents = hybrid_results[seg_id]["entities"]
        corrected_label = normalize_label(seg["label"], text)

        # Candidate Info
        if corrected_label == "contact":
            resume["candidate"].update({
                "name": safe_get_first(ents.get("names")),
                "email": safe_get_first(ents.get("emails")),
                "phone": safe_get_first(ents.get("phones")),
                "location": safe_get_first(ents.get("locations"))
            })

        elif corrected_label == "education":
            resume["education"].append({
                "degree": safe_get_first(ents.get("degrees")),
                "institution": safe_get_first(ents.get("institutions")),
                "start_year": safe_get_first(ents.get("years")),
                "end_year": safe_get_last(ents.get("years")),
                "location": safe_get_first(ents.get("locations"))
            })

        elif corrected_label in ["experience", "exp"]:
            job_title = next((w for w in JOB_TITLES if w in text.lower()), None)
            resume["experience"].append({
                "job_title": job_title,
                "company": safe_get_first(ents.get("companies")),
                "start_date": safe_get_first(ents.get("dates")),
                "end_date": safe_get_last(ents.get("dates")),
                "location": safe_get_first(ents.get("locations")),
                "achievements": text
            })

        elif corrected_label == "skills":
            resume["skills"].extend(ents.get("skills", []))

        elif corrected_label == "activities":
            resume["activities"].append(text)

        elif corrected_label in ["certifications", "licenses"]:
            resume["certifications"].extend(ents.get("certifications", []))

    resume["skills"] = sorted(set(resume["skills"]))
    return resume

# =========================
# Main Hybrid Runner
# =========================
def extract_resume_entities(classified_segments):
    """Full pipeline to extract named entities and structure resume data."""
    segment_dict = {seg["segment_id"]: (seg["label"], seg["text"]) for seg in classified_segments}
    hybrid_results = run_transformer_ner(segment_dict)
    resume_json = build_resume_json_v2(classified_segments, hybrid_results, SKILLS)
    return resume_json
