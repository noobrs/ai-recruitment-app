from typing import Dict, List
from api.types.types import ResumeData, CandidateOut, EducationOut, ExperienceOut, CertificationOut, ActivityOut

def build_final_response(normalized):
    candidate_info = {
        "name": normalized.get("name", ""),
        "email": normalized.get("email", ""),
        "phone": normalized.get("phone", ""),
        "location": normalized.get("location", "")
    }

    education_list = []
    for edu in normalized.get("education", []):
        education_list.append({
            "degree": edu.get("degree", ""),
            "institution": edu.get("school", ""),
            "location": edu.get("location", ""),
            "start_date": edu.get("year", ""),
            "end_date": "",
            "description": edu.get("school", "")
        })

    experience_list = []
    for exp in normalized.get("experience", []):
        experience_list.append({
            "job_title": exp.get("title", ""),
            "company": exp.get("company", ""),
            "location": exp.get("location", ""),
            "start_date": exp.get("start_date", ""),
            "end_date": exp.get("end_date", ""),
            "description": exp.get("description", "")
        })
        
    certification_list = []
    for cert in normalized.get("certifications", []):
        certification_list.append({
            "name": cert.get("name", ""),
            "description": cert.get("description", "")
        })
        
    activities_list = []
    for act in normalized.get("activities", []):
        activities_list.append({
            "description": act.get("description", "")
        })

    return {
        "candidate": candidate_info,
        "education": education_list,
        "experience": experience_list,
        "skills": normalized.get("skills", []),
        "certifications": certification_list,
        "activities": activities_list,
    }

def convert_image_resume_to_data(resume_dict: Dict) -> ResumeData:
    """
    Convert your image-based resume_dict into ResumeData model.
    Matches the structure expected by frontend & Supabase.
    """

    # -------- CANDIDATE --------
    cand = resume_dict.get("candidate", {})
    candidate_model = CandidateOut(
        name=cand.get("name") or "",
        email=cand.get("email") or "",
        phone=cand.get("phone") or "",
        location=cand.get("location") or "",
    )

    # -------- EDUCATION --------
    edu_models: List[EducationOut] = []
    for e in resume_dict.get("education", []):
        edu_models.append(
            EducationOut(
                degree=e.get("degree") or "",
                institution=e.get("institution") or "",
                location=e.get("location") or "",
                start_date=e.get("start_date") or "",
                end_date=e.get("end_date") or "",
                description=e.get("description") or "",
            )
        )

    # -------- EXPERIENCE --------
    exp_models: List[ExperienceOut] = []
    for ex in resume_dict.get("experience", []):
        exp_models.append(
            ExperienceOut(
                job_title=ex.get("job_title") or "",
                company=ex.get("company") or "",
                location=ex.get("location") or "",
                start_date=ex.get("start_date") or "",
                end_date=ex.get("end_date") or "",
                description=ex.get("description") or "",
            )
        )

    # -------- CERTIFICATIONS --------
    cert_models = []
    for c in resume_dict.get("certifications", []):
        cert_models.append(
            CertificationOut(
                name=c.get("name") or "",
                description=c.get("description") or ""
            )
        )

    # -------- ACTIVITIES --------
    act_models = []
    for a in resume_dict.get("activities", []):
        desc = a.get("description") or ""
        first_line = desc.split("\n")[0].strip() if desc else ""
        act_models.append(
            ActivityOut(
                name=first_line,
                description=desc
            )
        )

    # -------- FINAL COMBINED MODEL --------
    return ResumeData(
        candidate=candidate_model,
        education=edu_models,
        experience=exp_models,
        skills=resume_dict.get("skills", []) or [],
        certifications=cert_models,
        activities=act_models,
    )
