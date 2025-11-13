# api/image/builder.py
def build_resume_json_v2(classified_segments, hybrid_results):
    """Builds unified structured JSON from hybrid NER + classification results."""
    resume = {
        "candidate": {"name": None, "email": None, "phone": None, "location": None},
        "education": [],
        "experience": [],
        "skills": [],
        "certifications": [],
        "activities": []
    }

    JOB_TITLES = ["nurse", "engineer", "developer", "manager", "assistant",
                  "analyst", "consultant", "technician"]

    for seg in classified_segments:
        seg_id = seg["segment_id"]
        text = seg["text"]
        ents = hybrid_results.get(seg_id, {}).get("entities", {})
        # normalize label
        label = seg["label"].lower()

        if label == "contact":
            resume["candidate"].update({
                "name": (ents.get("names") or [None])[0],
                "email": (ents.get("emails") or [None])[0],
                "phone": (ents.get("phones") or [None])[0],
                "location": (ents.get("locations") or [None])[0]
            })

        elif label == "education":
            resume["education"].append({
                "degree": None,
                "institution": (ents.get("institutions") or [None])[0],
                "dates": ents.get("dates", [])
            })

        elif label in ["experience", "exp"]:
            resume["experience"].append({
                "job_title": None,
                "company": (ents.get("companies") or [None])[0],
                "dates": ents.get("dates", []),
                "achievements": text
            })

        elif label == "skills":
            resume["skills"].extend(ents.get("skills", []))

        elif label == "activities":
            resume["activities"].append(text)

    resume["skills"] = sorted(set(resume["skills"]))
    return resume
