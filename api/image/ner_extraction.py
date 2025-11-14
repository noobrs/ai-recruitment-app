# api/image/ner_extraction.py
import re
from transformers import pipeline
from pathlib import Path
import json
import os

# device
try:
    import torch
    device = 0 if torch.cuda.is_available() else -1
except Exception:
    device = -1

ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple",
    device=device
)

# locate skills file relative to this file
BASE = Path(__file__).parent
SKILLS_FILE = BASE / "data" / "skills.txt"
if SKILLS_FILE.exists():
    with open(SKILLS_FILE, "r", encoding="utf-8") as f:
        SKILLS = [line.strip().lower() for line in f if line.strip()]
else:
    SKILLS = []

# patterns
EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}"
PHONE_PATTERN = r"(\+?\d[\d\s\-]{6,}\d)"
LINK_PATTERN = r"(https?://\S+|linkedin\.com\S+|github\.com\S+)"

def extract_skills_from_text(text: str):
    t = text.lower()
    found = [s for s in SKILLS if re.search(r"\b" + re.escape(s) + r"\b", t)]
    return sorted(set(found))

def normalize_entities(seg_label, text, ents):
    # simplified normalization returning dict
    result = {
        "emails": re.findall(EMAIL_PATTERN, text),
        "phones": re.findall(PHONE_PATTERN, text),
        "links": re.findall(LINK_PATTERN, text),
        "skills": extract_skills_from_text(text)
    }
    # transformer entities to dict
    orgs = [t for t,l in ents if l == "ORG"]
    persons = [t for t,l in ents if l in ("PER", "PERSON")]
    dates = [t for t,l in ents if l == "DATE"]
    if seg_label.lower() in ("experience", "exp"):
        result.update({"companies": orgs, "roles": persons, "dates": dates})
    if seg_label.lower() in ("education",):
        result.update({"institutions": orgs, "dates": dates})
    return result

def run_transformer_ner(segment_dict):
    results = {}
    for seg_id, (label, text) in segment_dict.items():
        try:
            entities = ner_pipeline(text)
            ents = [(e["word"], e["entity_group"]) for e in entities]
        except Exception:
            ents = []
        results[seg_id] = {"label": label, "text": text, "entities": normalize_entities(label, text, ents)}
    return results

def extract_resume_entities(classified_segments):
    """classified_segments: list with keys segment_id,label,text"""
    segment_dict = {seg["segment_id"]: (seg["label"], seg["text"]) for seg in classified_segments}
    hybrid_results = run_transformer_ner(segment_dict)
    return hybrid_results
