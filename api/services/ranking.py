import json
import re
from difflib import SequenceMatcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# -----------------------------------------
# Helpers
# -----------------------------------------
def normalize(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()


# -----------------------------------------
# Fuzzy + substring + exact matching (BEST)
# -----------------------------------------
def simple_skill_match(skills, requirement):
    req = normalize(requirement)

    best_score = 0.0

    for skill in skills:
        s = normalize(skill)

        # EXACT match
        if s == req:
            return 1.0

        # SUBSTRING match (ReactJS contains "react")
        if req in s:
            best_score = max(best_score, 0.9)

        # FUZZY similarity (Node.js ≈ nodejs)
        ratio = SequenceMatcher(None, s, req).ratio()
        if ratio > 0.8:
            best_score = max(best_score, ratio)

    return best_score


# -----------------------------------------
# Education matching (fuzzy included)
# -----------------------------------------
def education_match(education_list, requirement):
    req = normalize(requirement)
    combined = " ".join([normalize(e.get("degree", "")) for e in education_list])

    if req in combined:
        return 1.0

    ratio = SequenceMatcher(None, combined, req).ratio()
    return ratio


# -----------------------------------------
# Experience matching
# -----------------------------------------
def experience_match(experience_list, requirement):
    req_tokens = normalize(requirement).split()

    # Combine all experience descriptions into one string
    combined_desc = " ".join([normalize(e.get("description", "")) for e in experience_list])
    desc_tokens = combined_desc.split()

    if not req_tokens or not desc_tokens:
        return 0.0

    scores = []

    # Compare each requirement word to all experience words
    for req_word in req_tokens:
        best = 0.0
        for exp_word in desc_tokens:
            ratio = SequenceMatcher(None, req_word, exp_word).ratio()
            if ratio > best:
                best = ratio
        scores.append(best)

    # Mean similarity score (0–1)
    return sum(scores) / len(scores)

# -----------------------------------------
# Main scoring function
# -----------------------------------------
def compute_match_score(resume, job_requirements):
    skills = resume.get("skills", [])
    education = resume.get("education", [])
    experience = resume.get("experience", [])

    skill_sum = exp_sum = edu_sum = 0.0
    skill_weight = exp_weight = edu_weight = 0.0

    for req in job_requirements:
        req_type = req["type"]
        text = req["normalized_requirement"] or req["requirement"]
        weight = req["weightage"]

        if req_type == "skill":
            score = simple_skill_match(skills, text)
            skill_sum += score * weight
            skill_weight += weight

        elif req_type == "experience":
            score = experience_match(experience, text)
            exp_sum += score * weight
            exp_weight += weight

        elif req_type == "education":
            score = education_match(education, text)
            edu_sum += score * weight
            edu_weight += weight

    skill_score = skill_sum / skill_weight if skill_weight > 0 else 0
    exp_score   = exp_sum   / exp_weight   if exp_weight > 0 else 0
    edu_score   = edu_sum   / edu_weight   if edu_weight > 0 else 0

    total_category_weight = skill_weight + exp_weight + edu_weight

    cat_skill = skill_weight / total_category_weight if total_category_weight > 0 else 0
    cat_exp   = exp_weight   / total_category_weight if total_category_weight > 0 else 0
    cat_edu   = edu_weight   / total_category_weight if total_category_weight > 0 else 0

    raw = (
        skill_score * cat_skill +
        exp_score   * cat_exp +
        edu_score   * cat_edu
    )

    final_score = round(raw * 100, 2)

    return {
        "skills_score": round(skill_score, 4),
        "experience_score": round(exp_score, 4),
        "education_score": round(edu_score, 4),
        "final_score": final_score,
        "category_weights": {
            "skills": round(cat_skill, 4),
            "experience": round(cat_exp, 4),
            "education": round(cat_edu, 4),
        }
    }
