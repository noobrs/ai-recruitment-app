from __future__ import annotations
from typing import Dict, List
from .config import REGEX_EDU_SCORE
from .types import Aggregated, GroupBlock
from .utils import update_best
from .gliner_extraction import extract_majors_from_text

def aggregate_for_db(groups_with_preds: List[GroupBlock]) -> Aggregated:
    skill_best: Dict[str, float] = {}
    edu_best: Dict[str, float] = {}
    title_best: Dict[str, float] = {}

    for g in groups_with_preds:
        ents  = g.entities or []
        head  = g.heading or ""
        body  = g.text or ""

        for e in ents:
            lbl = (e["label"] or "").lower()
            if lbl in ("skill", "language"):
                update_best(skill_best, e["text"], e["score"])
            elif lbl == "job title":
                update_best(title_best, e["text"], e["score"])
            elif lbl == "degree":
                update_best(edu_best, e["text"], e["score"])

        for maj in extract_majors_from_text(head):
            update_best(edu_best, maj, REGEX_EDU_SCORE)
        for maj in extract_majors_from_text(body):
            update_best(edu_best, maj, REGEX_EDU_SCORE)

        for e in ents:
            if (e["label"] or "").lower() == "degree":
                for maj in extract_majors_from_text(e["text"]):
                    update_best(edu_best, maj, max(REGEX_EDU_SCORE, e.get("score", 0.0)))

    def as_sorted_items(best: Dict[str, float]):
        items = [{"text": k, "score": round(v, 4)} for k, v in best.items()]
        items.sort(key=lambda x: x["score"], reverse=True)
        return items

    return {
        "skills": as_sorted_items(skill_best),
        "education_majors": as_sorted_items(edu_best),
        "experience_titles": as_sorted_items(title_best),
    }
