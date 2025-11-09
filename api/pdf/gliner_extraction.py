from __future__ import annotations
import os, re
from typing import Dict, List
from gliner import GLiNER

from .config import (
    GLINER_MODEL_NAME, GLINER_LABELS,
    THR_SKILL, THR_DEGREE, THR_TITLE, THR_LANG, REGEX_EDU_SCORE
)
from .types import Entity, GroupBlock
from .utils import update_best, similar

# ---------- lazy GLiNER ----------
_GLINER: GLiNER | None = None

def get_gliner() -> GLiNER:
    global _GLINER
    if _GLINER is None:
        os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
        _GLINER = GLiNER.from_pretrained(GLINER_MODEL_NAME)
    return _GLINER

# ---------- degree/major regex ----------
DEGREE_PATTERNS = [
    r"\bBachelor(?:'s)?\s+(?:of\s+)?([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bBachelor(?:'s)?\s+in\s+([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bB\.?\s?(?:Sc|Eng|Tech|CompSci|CS|IT|A|BA)\b(?:\s*\(Hons?\))?\s+([A-Z][\w &/().,-]{2,})",
    r"\bMaster(?:'s)?\s+(?:of\s+)?([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bMaster(?:'s)?\s+in\s+([A-Z][\w &/().,-]{2,})(?=$|[.,;)\n])",
    r"\bM\.?\s?(?:Sc|Eng|Tech|IT|BA|PA|Ed)\b(?:\s*\(Hons?\))?\s+([A-Z][\w &/().,-]{2,})",
    r"\bMBA\b(?:\s?(?:in|of)\s([A-Z][\w &/().,-]{2,}))?",
    r"\bPh\.?D\.?\s+in\s+([A-Z][\w &/().,-]{2,})",
    r"\bDoctor\s+of\s+([A-Z][\w &/().,-]{2,})",
    r"\bDPhil\s+in\s+([A-Z][\w &/().,-]{2,})",
    r"\bDiploma\s+(?:in|of)\s+([A-Z][\w &/().,-]{2,})",
]

def _infer_degree_prefix(context: str) -> str:
    ctx = context.lower()
    if "bachelor" in ctx or re.search(r"\bB\.?\s?(Sc|Eng|Tech|A|CS|IT)\b", ctx, re.I):
        return "Bachelor of "
    if "master" in ctx or re.search(r"\bM\.?\s?(Sc|Eng|Tech|IT|BA|PA|Ed)\b", ctx, re.I) or "mba" in ctx:
        return "Master of "
    if "phd" in ctx or "doctor of" in ctx or "dphil" in ctx:
        return "Doctor of "
    if "diploma" in ctx:
        return "Diploma in "
    return ""

def extract_majors_from_text(text: str) -> List[str]:
    majors: List[str] = []
    for pat in DEGREE_PATTERNS:
        for m in re.finditer(pat, text, flags=re.IGNORECASE):
            span_text  = text[max(0, m.start()-30): m.end()+30]
            major_core = m.group(1) if m.lastindex else "Business Administration"
            major_core = re.sub(r"[\s,.;:)\]]+$", "", (major_core or "").strip())
            prefix     = _infer_degree_prefix(span_text)
            pretty     = f"{prefix}{major_core}" if prefix else major_core
            if pretty and all(not similar(pretty, x) for x in majors):
                majors.append(pretty)
    return majors

def run_gliner_on_group(
    gliner: GLiNER,
    heading: str,
    body: str,
    thr_skill: float = THR_SKILL,
    thr_degree: float = THR_DEGREE,
    thr_title: float = THR_TITLE,
    thr_lang: float  = THR_LANG,
) -> List[Entity]:
    out: List[Entity] = []
    thr_map = {
        "skill": thr_skill,
        "degree": thr_degree,
        "job title": thr_title,
        "language": thr_lang,
    }

    def _keep(e: Dict) -> bool:
        score = float(e.get("score", 0.0))
        need = thr_map.get((e.get("label") or "").lower(), 0.0)
        return score >= need

    if (body or "").strip():
        for e in gliner.predict_entities(body, GLINER_LABELS, threshold=0.0):
            if _keep(e):
                out.append({
                    "text": e["text"], "label": e["label"],
                    "start_char": int(e.get("start", -1)),
                    "end_char": int(e.get("end", -1)),
                    "score": float(e.get("score", 0.0)),
                })

    if heading and heading not in ("", "NO_HEADING"):
        for e in gliner.predict_entities(heading, GLINER_LABELS, threshold=0.0):
            if _keep(e):
                out.append({
                    "text": e["text"], "label": e["label"],
                    "start_char": int(e.get("start", -1)),
                    "end_char": int(e.get("end", -1)),
                    "score": float(e.get("score", 0.0)),
                })
    return out
