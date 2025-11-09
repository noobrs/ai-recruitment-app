from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, TypedDict

@dataclass
class GroupBlock:
    heading: str
    text: str
    span_count: int
    labels: List[str]
    entities: List["Entity"] = field(default_factory=list)

class Entity(TypedDict):
    text: str
    label: str
    start_char: int
    end_char: int
    score: float

class Aggregated(TypedDict):
    skills: List[Dict[str, float]]
    education_majors: List[Dict[str, float]]
    experience_titles: List[Dict[str, float]]

class ParseResult(TypedDict):
    source_url: str
    grouped_blocks: List[GroupBlock]
    aggregated_for_db: Aggregated
