from __future__ import annotations
import os, re
from typing import Dict, Optional
from rapidfuzz import fuzz

def norm(s: str) -> str:
    return " ".join((s or "").strip().split()).lower()

def is_valid_item(text: str) -> bool:
    if not text: return False
    t = text.strip()
    if len(t) < 3 or len(t) > 60: return False
    if t.isupper() and len(t.split()) == 1: return False
    return True

def update_best(best: Dict[str, float], text: str, score: float) -> None:
    if not is_valid_item(text): return
    key = norm(text)
    if key not in best or score > best[key]:
        best[key] = float(score)

def similar(a: str, b: str, thresh: int = 92) -> bool:
    return fuzz.token_sort_ratio(a, b) >= thresh

def normalize_heading(text: Optional[str]) -> str:
    if not text: return "NO_HEADING"
    return " ".join(text.strip().split())
