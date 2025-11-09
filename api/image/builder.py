def build_resume_json_v2(classified_segments, hybrid_results):
    """Builds unified structured JSON from hybrid NER + classification results."""
    resume = {
        "candidate": {"name": None, "email": None, "phone": None},
        "education": [],
        "experience": [],
        "skills": [],
    }

    for seg in classified_segments:
        sid = seg["segment_id"]
        label = seg["label"].lower()
        text = seg["text"]
        data = hybrid_results.get(sid, {})
        ents = data.get("entities", [])
        regex = data.get("regex", {})

        if label == "contact":
            resume["candidate"]["email"] = (regex.get("emails") or [None])[0]
            resume["candidate"]["phone"] = (regex.get("phones") or [None])[0]

        elif label == "education":
            resume["education"].append({"text": text})

        elif label == "experience":
            resume["experience"].append({"text": text})

        elif label == "skills":
            resume["skills"].extend([ent[0] for ent in ents if ent[1] in ["ORG", "PRODUCT"]])

    resume["skills"] = list(set(resume["skills"]))
    return resume
