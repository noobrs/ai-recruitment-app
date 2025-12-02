"""
- ConLL NER wrapper
- SkillNer wrapper
- Regex extractors: email, phone, dates
- Rule-based: names, degrees, job_titles (uses find_job_titles), companies
This file keeps the logic compact and re-usable by ner_pipeline.
"""

import re
from transformers import pipeline
import spacy
from spacy.matcher import PhraseMatcher
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor
from find_job_titles import Finder

# -------------------------
# ConLL NER
# -------------------------
conll_ner = pipeline(
    "ner",
    model="dbmdz/bert-large-cased-finetuned-conll03-english",
    aggregation_strategy="simple",
    device=0
)

def extract_conll_entities(text):
    results = conll_ner(text)
    entities = {"PER": [], "ORG": [], "LOC": []}
    for ent in results:
        etype = ent.get("entity_group")
        value = ent.get("word", "").replace("##", "").strip()
        if etype in entities and value:
            entities[etype].append(value)
    return {k: list(set(v)) for k, v in entities.items()}

# -------------------------
# SkillNer
# -------------------------
_nlp = spacy.load("en_core_web_sm")
_skill_extractor = SkillExtractor(_nlp, SKILL_DB, PhraseMatcher)

def extract_skills_skillner(text, score_threshold=0.90):
    try:
        parsed = _skill_extractor.annotate(text)
        results = parsed.get("results", {})
    except Exception:
        return []
    skills = set()
    for item in results.get("full_matches", []):
        v = item.get("doc_node_value")
        if v: skills.add(v.lower().strip())
    for item in results.get("ngram_scored", []):
        score = float(item.get("score", 0))
        if score >= score_threshold:
            v = item.get("doc_node_value")
            if v: skills.add(v.lower().strip())
    clean = [re.sub(r"\s+", " ", s).strip().capitalize() for s in skills if len(s) > 1]
    return sorted(set(clean))

# -------------------------
# Regex helpers
# -------------------------
def extract_email(text):
    m = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,}", text)
    return m.group(0) if m else None

def extract_phone(text):
    m = re.search(r"(\+?\d[\d\-\s]{7,}\d)", text)
    return m.group(0) if m else None

def extract_dates(text):
    results = set()
    t = text.replace("–", "-").replace("—", "-")
    month = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)"
    year = r"(19[5-9]\d|20[0-4]\d|2050)"
    patterns = [
        rf"{month}\s+{year}",
        rf"{month}{year}",
        rf"{year}\s*[-/]\s*{year}",
        rf"{year}\s*[-/]\s*(Present|Current|Now)",
        rf"{month}\s*/\s*{year}",
        r"\b(0[1-9]|1[0-2])[-/](19[5-9]\d|20[0-4]\d)\b",
        rf"\b{year}\b"
    ]
    for p in patterns:
        for m in re.findall(p, t, flags=re.I):
            if isinstance(m, tuple): m = " ".join(m)
            results.add(m.strip())
    cleaned = []
    for r in results:
        if len(r) == 4 and not r.startswith(("19", "20")): continue
        cleaned.append(r)
    return sorted(set(cleaned))

# -------------------------
# Names (heuristic)
# -------------------------
def extract_names(text):
    cleaned = (text or "").strip()
    lines = cleaned.split("\n")
    header = " ".join(lines[:2])
    header_matches = re.findall(r"\b([A-Z][a-zA-Z]{1,30}(?: [A-Z][a-zA-Z]{1,30}){0,3})\b", header)
    bad_words = {"EDUCATION","EXPERIENCE","EMPLOYMENT","SKILLS","PROJECTS","SUMMARY","CERTIFICATIONS","INTERNSHIPS"}
    header_matches = [n for n in header_matches if n.upper() not in bad_words]
    all_matches = re.findall(r"\b([A-Z][a-zA-Z]{1,30}(?: [A-Z][a-zA-Z]{1,30}){1,3})\b", cleaned)
    all_matches = [n for n in all_matches if n.upper() not in bad_words]
    names = list(set(header_matches + all_matches))
    title_words = ["Engineer","Developer","Manager","Scientist","Analyst","Assistant"]
    org_words = ["University","Technologies","Company","Ltd","Corporation","Inc"]
    final = []
    for name in names:
        if any(w in name for w in title_words): continue
        if any(w in name for w in org_words): continue
        final.append(name)
    return final

# -------------------------
# Degree extractor (improved)
# -------------------------
def extract_degrees(text):
    # mild normalisations for merged tokens
    txt = (text or "")
    DEG = r"(BS|B\.?Sc|BA|B\.?Tech|BTech|BE|MS|M\.?Sc|MA|M\.?Tech|MTech|ME|MBA|PhD|P\.?h\.?D|Diploma|Bachelor|Master|Doctor)"
    CONNECT = r"(in|of)"
    MAJOR = r"([A-Za-z][A-Za-z0-9\s&\-]{2,60}?)"
    pattern = rf"\b{DEG}\s+{CONNECT}\s+{MAJOR}(?=[.,\n]|$)"
    matches = re.findall(pattern, txt, flags=re.I)
    results = []
    for m in matches:
        degree = m[0].replace(".", "").upper()
        connector = m[1].lower()
        major = re.sub(r"\s{2,}", " ", m[2]).rstrip(".,- ")
        results.append(f"{degree} {connector} {major}")
    return list(set(results))

# -------------------------
# Company extractor (stricter)
# -------------------------
def extract_companies(segment_text, conll_entities, segment_label):
    text = (segment_text or "").strip()
    orgs = conll_entities.get("ORG", []) if conll_entities else []
    companies = set()
    # Add ConLL ORG candidates but filter out name-like small tokens
    for org in orgs:
        if not org or len(org) < 3: continue
        if org.isupper() and " " not in org: continue
        # reject single-token person-like
        if len(org.split()) <= 2 and all(w[0].isupper() for w in org.split()):
            continue
        companies.add(org)
    # suffix scan
    SUFFIXES = ["Technologies","Technology","Solutions","Labs","Software","Limited","Ltd","LLC","Inc","Corporation","Corp","Enterprises","Group","Consulting","Sdn Bhd","Pvt Ltd"]
    for suf in SUFFIXES:
        for m in re.findall(rf"\b([A-Z][A-Za-z0-9&\-. ]*{suf})\b", text):
            companies.add(m.strip())
    # context patterns
    for pat in [r"at ([A-Z][A-Za-z0-9&\-. ]+)", r"\| ([A-Z][A-Za-z0-9&\-. ]+)", r"for ([A-Z][A-Za-z0-9&\-. ]+)"]:
        for m in re.findall(pat, text):
            companies.add(m.strip())
    # education -> university detection
    if segment_label and segment_label.lower() == "education":
        for m in re.findall(r"\b([A-Z][A-Za-z ]+University)\b", text):
            companies.add(m)
    # blocklist
    BLOCK = {"INTERNSHIPS", "EMPLOYMENT", "EMPLOYMENT HISTORY", "INTERNSHIP"}
    final = []
    for c in companies:
        if not c: continue
        if any(b.lower() in c.lower() for b in BLOCK): continue
        if re.search(r"\d", c): continue
        # require at least two tokens for robustness
        if len(c.split()) < 2: continue
        final.append(c.strip(" .,-"))
    return list(set(final))

# -------------------------
# Job titles (header-aware using find_job_titles)
# -------------------------
_finder = Finder()
RULE_TITLES = [
    "Software Engineer","Data Scientist","Machine Learning Engineer","Developer","Data Analyst","Intern",
    "Team Leader","Project Manager","Marketing Manager","Full Stack Developer","Data Annotator"
]

def extract_job_titles(text, segment_label=None):
    if segment_label and segment_label.lower() in ["education","skills","pi"]:
        return []
    lines = (text or "").split("\n")
    header = " ".join(lines[:3])
    header_tc = header.title()
    extracted = []
    try:
        matches = list(_finder.finditer(header_tc))
        extracted = [m.match for m in matches if m and getattr(m, "match", None)]
    except Exception:
        extracted = []
    rule_matches = [t for t in RULE_TITLES if t.lower() in header.lower()]
    merged = extracted + rule_matches
    BAD = {"Providing","Supported","Conducting","Maintaining","Documenting","Analysing","Skills","Projects","History"}
    cleaned = []
    for t in merged:
        if not t: continue
        t = t.strip()
        if any(b.lower() in t.lower() for b in BAD): continue
        # job titles usually >= 2 words -> relax for single-token like "Intern"
        if len(t.split()) == 1 and t.lower() not in ("intern","manager","engineer"):
            continue
        cleaned.append(t)
    return list(set(cleaned))

# -------------------------
# filters (segment aware)
# -------------------------
def apply_segment_filters(result):
    label = (result.get("label") or "").lower()
    result.setdefault("names", [])
    result.setdefault("companies", [])
    result.setdefault("locations", [])
    result.setdefault("skills", [])
    result.setdefault("job_titles", [])
    result.setdefault("degrees", [])
    result.setdefault("emails", None)
    result.setdefault("phones", None)
    result.setdefault("dates", [])
    if label == "education":
        result["job_titles"] = []
        result["skills"] = []
        result["names"] = []
        result["companies"] = [c for c in result["companies"] if "university" in c.lower()]
    if label in ["exp","experience","internships"]:
        result["degrees"] = []
        result["names"] = []
        result["job_titles"] = [t for t in result["job_titles"] if not any(w in t.lower() for w in ["providing","supported","conducting"])]
    if label == "skills":
        result["job_titles"] = []
        result["companies"] = []
        result["degrees"] = []
        result["names"] = []
        result["locations"] = []
        result["dates"] = []
    if label == "pi":
        result["skills"] = []
        result["degrees"] = []
        result["job_titles"] = []
        result["companies"] = []
        result["names"] = []
        result["dates"] = [d for d in result["dates"] if len(d) == 4 and d.startswith("20")]
    if label in ["sum","summary","about"]:
        result["companies"] = []
        result["degrees"] = []
        result["job_titles"] = []
        result["names"] = []
    return result
