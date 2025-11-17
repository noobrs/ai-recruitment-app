"""
GLiNER-related utilities:
- Model loading
- Entity prediction on grouped text
- Bias (race/gender) detection via regex fallback
"""

import re
from collections import defaultdict
from typing import Dict, List

from gliner import GLiNER
from gliner.model import GLiNERConfig

from api.pdf.config import BIAS_LABELS, GLINER_LABELS, GLINER_MODEL_NAME
from api.pdf.utils import _pass_threshold
from api.pdf.regexes import EMAIL_RE, PHONE_RE  # imported for other helpers if needed

# Minimal race/gender regex fallback (for gating in bias endpoint)
GENDER_LINE_RE = re.compile(
    r"\b(Gender|Sex)\b\s*[:\-]?\s*(Male|Female|M|F)\b", re.I
)
ETHNICITY_LINE_RE = re.compile(
    r"\b(Ethnicity|Race)\b\s*[:\-]?\s*([A-Za-z \-]{3,})\b", re.I
)
ETHNIC_KEYWORDS = re.compile(
    r"\b(Malay|Chinese|Indian|Bumiputera|Iban|Kadazan(?:-Dusun)?|Bidayuh|Orang Asli|Eurasian)\b",
    re.I,
)


def get_gliner(model_name: str = GLINER_MODEL_NAME) -> GLiNER:
    """
    Load GLiNER model and print its backbone for debugging.
    """
    cfg = GLiNERConfig.from_pretrained(model_name)
    print(f"[GLiNER] backbone: {cfg.model_name}")
    return GLiNER.from_pretrained(model_name)


def run_gliner_on_group(gliner: GLiNER, heading: str, body: str) -> Dict:
    """
    Run GLiNER on a grouped section (heading + body) and return:
      - entities: non-bias entities that pass threshold
      - bias_hits: entities labeled with bias labels (race/gender)
      - sensitive: True if any bias entity is present

    Returns:
        {
            "entities": [...],
            "bias_hits": [...],
            "sensitive": True/False
        }
    """

    def predict(text: str):
        if not text or not text.strip():
            return []
        return gliner.predict_entities(text, GLINER_LABELS, threshold=0.0)

    raw = []
    raw += predict(body)
    if heading and heading not in ("", "NO_HEADING"):
        raw += predict(heading)

    entities: List[Dict] = []
    bias_hits: List[Dict] = []

    for e in raw:
        lbl = (e.get("label") or "").strip()
        score = float(e.get("score", 0.0))
        if not _pass_threshold(lbl, score):
            continue

        item = {
            "text": e["text"],
            "label": lbl,
            "start_char": int(e.get("start", -1)),
            "end_char": int(e.get("end", -1)),
            "score": float(score),
        }
        if lbl in BIAS_LABELS:
            bias_hits.append(item)
        else:
            entities.append(item)

    sensitive = len(bias_hits) > 0
    return {"entities": entities, "bias_hits": bias_hits, "sensitive": sensitive}


def detect_race_gender_regex(text: str) -> List[Dict]:
    """
    Regex-based fallback for detecting gender and race/ethnicity
    in a text block, used to mark groups as sensitive.
    """
    hits: List[Dict] = []

    def add(_type: str, match_text: str, full_text: str, start: int, end: int):
        span = full_text[max(0, start - 20) : end + 20]
        hits.append(
            {"type": _type, "value": match_text.strip(), "snippet": span.strip()}
        )

    for m in GENDER_LINE_RE.finditer(text):
        add("gender", m.group(0), text, m.start(), m.end())

    for m in ETHNICITY_LINE_RE.finditer(text):
        add("race_ethnicity", m.group(0), text, m.start(), m.end())

    for m in ETHNIC_KEYWORDS.finditer(text):
        add("race_ethnicity", m.group(0), text, m.start(), m.end())

    return hits


__all__ = [
    "get_gliner",
    "run_gliner_on_group",
    "detect_race_gender_regex",
]
