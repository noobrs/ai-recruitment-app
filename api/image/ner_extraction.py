import re
import spacy

nlp = spacy.load("en_core_web_md")

EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}"
PHONE_PATTERN = r"\+?\d[\d\s-]{6,}\d"
LINK_PATTERN = r"(https?://\S+|linkedin\.com\S+|github\.com\S+)"

def extract_entities(classified_segments):
    """Performs NER + regex hybrid extraction."""
    results = {}
    for seg in classified_segments:
        text = seg["text"].replace("\n", " ")
        doc = nlp(text)
        ents = [(ent.text, ent.label_) for ent in doc.ents]
        regex_data = {
            "emails": re.findall(EMAIL_PATTERN, text),
            "phones": re.findall(PHONE_PATTERN, text),
            "links": re.findall(LINK_PATTERN, text),
        }
        results[seg["segment_id"]] = {
            "label": seg["label"],
            "entities": ents,
            "regex": regex_data,
            "text": text
        }
    return results
