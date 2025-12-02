"""
- Loads your fine-tuned BERT classifier saved at 'bert_resume_classifier' (model_path).
- Exposes classify_segments(ocr_results) accepting list of dicts {segment_id, text, box}
  Returns list of classified segments: {segment_id, label, score, text}
"""

from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

HF_MODEL_ID = "JokerYong/bert_resume_classifier_sections"

_tokenizer = None
_model = None
_pipeline = None


def _ensure_loaded():
    global _tokenizer, _model, _pipeline
    if _pipeline is None:
        print(f"Loading resume classifier from HuggingFace: {HF_MODEL_ID}")
        _tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
        _model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_ID)
        _pipeline = pipeline(
            "text-classification",
            model=_model,
            tokenizer=_tokenizer,
            device=0
        )
    return _pipeline

def normalize_label(label: str, text: str) -> str:
    text_upper = (text or "").strip().upper()
    if text_upper.startswith("SKILLS"):
        return "Skills"
    if text_upper.startswith("ACTIVITIES"):
        return "Activities"
    if text_upper.startswith("EDUCATION"):
        return "Education"
    if text_upper.startswith("LICENSES") or text_upper.startswith("CERTIFICATIONS"):
        return "Certifications"
    if text_upper.startswith("WORK EXPERIENCE") or text_upper.startswith("EXPERIENCE"):
        return "Experience"
    return label

def classify_segments(ocr_results):
    """
    ocr_results: list of {segment_id, text, box}
    Returns: list of {segment_id, label, score, text}
    """
    pipe = _ensure_loaded()
    classified = []
    for seg in ocr_results:
        text = seg.get("text", "") or ""
        if not text.strip():
            continue
        try:
            res = pipe(text[:1024])  # truncate to model max
            lbl = res[0]["label"]
            score = float(res[0]["score"])
            corrected = normalize_label(lbl, text)
            classified.append({
                "segment_id": seg.get("segment_id"),
                "label": corrected,
                "score": score,
                "text": text,
                "box": seg.get("box")
            })
        except Exception:
            # fallback to default label
            classified.append({
                "segment_id": seg.get("segment_id"),
                "label": "Unknown",
                "score": 0.0,
                "text": text,
                "box": seg.get("box")
            })
    return classified
