from transformers import pipeline

# zero-shot classifier or fine-tuned BERT
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=0)

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
    classified = []
    for seg in ocr_results:
        if not seg["text"].strip():
            continue
        result = classifier(seg["text"], CANDIDATE_LABELS)
        best_idx = result["scores"].index(max(result["scores"]))
        label = result["labels"][best_idx]
        short_label = [k for k, v in LABEL_MAP.items() if v == label][0]
        classified.append({
            "segment_id": seg["segment_id"],
            "label": short_label,
            "score": result["scores"][best_idx],
            "text": seg["text"]
        })
    return classified
