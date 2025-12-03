def build_final_response(normalized):
    candidate_info = {
        "name": normalized.get("name",""),
        "email": normalized.get("email",""),
        "phone": normalized.get("phone",""),
        "location": normalized.get("location","")
    }

    education_list = []
    for edu in normalized.get("education", []):
        education_list.append({
            "degree": edu.get("degree",""),
            "institution": edu.get("school",""),
            "location": edu.get("location",""),
            "start_date": edu.get("year",""),
            "end_date": "",
            "description": edu.get("school","")
        })

    experience_list = []
    for exp in normalized.get("experience", []):
        experience_list.append({
            "job_title": exp.get("title",""),
            "company": exp.get("company",""),
            "location": exp.get("location",""),
            "start_date": exp.get("start_date",""),
            "end_date": exp.get("end_date",""),
            "description": exp.get("description","")
        })

    final_json = {
        "status": "success",
        "data": {
            "candidate": candidate_info,
            "education": education_list,
            "experience": experience_list,
            "skills": normalized.get("skills", []),
            "certifications": normalized.get("certifications", []),
            "activities": []
        }
    }

    return final_json
