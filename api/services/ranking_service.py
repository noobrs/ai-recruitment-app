# api/services/ranking_service.py

import json
from .ranking import compute_match_score
from api.supabase_client import supabase


DEFAULT_WEIGHTS = {
    "alpha": 0.5,   # skills
    "beta": 0.3,    # experience
    "gamma": 0.2    # education
}


async def rank_application(application_id: int):
    """
    1. Fetch application row
    2. Fetch resume (skills, education, experience)
    3. Fetch job requirements
    4. Compute score
    5. Update application.match_score
    """

    # 1. Get application
    app_res = supabase.table("application").select("*").eq("application_id", application_id).single().execute()
    if not app_res.data:
        raise Exception("Application not found")

    application = app_res.data
    resume_id = application.get("resume_id")
    job_id = application.get("job_id")

    # 2. Get resume data
    resume_res = supabase.table("resume").select("*").eq("resume_id", resume_id).single().execute()
    resume_row = resume_res.data

    resume = {
        "skills": json.loads(resume_row["extracted_skills"] or "[]"),
        "education": json.loads(resume_row["extracted_education"] or "[]"),
        "experience": json.loads(resume_row["extracted_experiences"] or "[]"),
    }

    # 3. Get job requirements
    req_res = supabase.table("job_requirement").select("*").eq("job_id", job_id).execute()
    job_requirements = req_res.data

    # 4. Compute score
    result = compute_match_score(resume, job_requirements, DEFAULT_WEIGHTS)
    final_score = result["final_score"]

    # 5. Update application.match_score
    supabase.table("application")\
        .update({"match_score": final_score})\
        .eq("application_id", application_id)\
        .execute()

    return {
        "application_id": application_id,
        "job_id": job_id,
        "resume_id": resume_id,
        "scores": result
    }
