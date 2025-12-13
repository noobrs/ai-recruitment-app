import logging
from typing import List

logger = logging.getLogger(__name__)

from api.types.types import TextGroup, TextSpan, CandidateOut, ResumeData
from api.pdf.entity_extraction import build_skills, build_educations, build_experiences, build_certifications, build_activities


# =============================================================================
# Main Resume Building Function
# =============================================================================

def build_resume_data(groups: List[TextGroup], person_spans: List[TextSpan]) -> ResumeData:

    logger.info("Building structured resume data...")
    
    candidate = {
        "name": None,
        "email": None,
        "phone": None,
        "location": None,
    }

    for span in person_spans:
        if span.label == "person" and not candidate["name"]:
            candidate["name"] = span.text
        elif span.label == "email" and not candidate["email"]:
            candidate["email"] = span.text
        elif span.label == "phone number" and not candidate["phone"]:
            candidate["phone"] = span.text
        elif span.label == "location" and not candidate["location"]:
            candidate["location"] = span.text


    skills = build_skills(groups)
    educations = build_educations(groups)
    experiences = build_experiences(groups)
    certifications = build_certifications(groups)
    activities = build_activities(groups)

    resume_data = ResumeData(
        candidate=CandidateOut(**candidate),
        education=educations,
        experience=experiences,
        skills=skills,
        certifications=certifications,
        activities=activities
    )
    
    return resume_data
