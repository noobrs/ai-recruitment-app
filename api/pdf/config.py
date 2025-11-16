from __future__ import annotations

GLINER_MODEL_NAME = "urchade/gliner_small-v2.1"
GLINER_LABELS = ["Skill", "Degree", "Job Title", "Language"]

THR_SKILL = 0.50
THR_DEGREE = 0.50
THR_TITLE = 0.50
THR_LANG  = 0.50

# Regex scoring used when majors are inferred from patterns
REGEX_EDU_SCORE = 0.88

# Layout span labels to skip during grouping
SKIP_SPAN_LABELS = {"table", "picture", "equation"}
