# api/image/text_classification.py
from transformers import pipeline
import os

# device selection: use GPU if available
try:
    import torch
    device = 0 if torch.cuda.is_available() else -1
except Exception:
    device = -1

# instantiate once
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=device)

LABEL_MAP = {
    "Education": "Educational Background and Degrees",
    "Experience": "Work and Professional Experience",
    "Profile": "Profile Summary or Personal Statement",
    "Skills": "Skills and Competencies",
    "Contact": "Contact Information",
    "Languages": "Languages Spoken",
    "Other": "Other Information",
}
CANDIDATE_LABELS = list(LABEL_MAP.values())

def classify_segments(ocr_results):
    """ocr_results: list of dicts with keys 'segment_id' and 'text'"""
    classified = []
    for seg in ocr_results:
        text = seg.get("text","").strip()
        if not text:
            continue
        try:
            result = classifier(text, CANDIDATE_LABELS)
            # pick best
            best_idx = int(result["scores"].index(max(result["scores"])))
            label = result["labels"][best_idx]
            short_label = [k for k, v in LABEL_MAP.items() if v == label][0]
            classified.append({
                "segment_id": seg["segment_id"],
                "label": short_label,
                "score": float(result["scores"][best_idx]),
                "text": text,
                "box": seg.get("box")
            })
        except Exception:
            classified.append({
                "segment_id": seg["segment_id"],
                "label": "Other",
                "score": 0.0,
                "text": text,
                "box": seg.get("box")
            })
    return classified
