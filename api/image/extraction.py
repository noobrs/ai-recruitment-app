import re
import logging
import nltk
from transformers import pipeline as hf_pipeline
import spacy
from spacy.matcher import PhraseMatcher
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor
from find_job_titles import Finder

logger = logging.getLogger("api.image.extraction")

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

nlp = spacy.load("en_core_web_sm")
skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)
finder = Finder()
conll_ner = hf_pipeline(
    "ner",
    model="dbmdz/bert-large-cased-finetuned-conll03-english",
    aggregation_strategy="simple",
    device=0
)

def extract_skills_skillner(text, score_threshold=0.90):
    try:
        parsed = skill_extractor.annotate(text)
        results = parsed.get("results", {})
    except Exception:
        return []
    skills = set()
    for item in results.get("full_matches", []):
        name = item.get("doc_node_value")
        if name:
            skills.add(name.lower().strip())
    for item in results.get("ngram_scored", []):
        score = float(item.get("score", 0))
        if score >= score_threshold:
            name = item.get("doc_node_value")
            if name:
                skills.add(name.lower().strip())
    cleaned = []
    for s in skills:
        s2 = re.sub(r"\s+", " ", s).strip()
        if len(s2) > 1:
            cleaned.append(s2.capitalize())
    return sorted(set(cleaned))

def extract_conll_entities(text):
    try:
        results = conll_ner(text)
    except Exception:
        return {"PER": [], "ORG": [], "LOC": []}
    entities = {"PER": [], "ORG": [], "LOC": []}
    for ent in results:
        etype = ent.get("entity_group")
        value = ent.get("word", "").replace("##", "").strip()
        if etype in entities and value:
            entities[etype].append(value)
    for k in entities:
        entities[k] = list(set(entities[k]))
    return entities

def extract_email(text):
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}", text)
    return m.group(0) if m else None

def extract_phone(text):
    m = re.search(r"(\+?\d[\d\-\s]{7,}\d)", text)
    return m.group(0) if m else None

def extract_dates(text):
    results = set()
    t = text.replace("–", "-").replace("—", "-")
    month = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)"
    year = r"(19[5-9]\d|20[0-4]\d|2050)"
    patterns = [
        rf"{month}\s+{year}",
        rf"{month}{year}",
        rf"{year}\s*[-/]\s*{year}",
        rf"{year}\s*[-/]\s*(Present|Current|Now)",
        rf"{month}\s*/\s*{year}",
        r"\b(0[1-9]|1[0-2])[-/](19[5-9]\d|20[0-4]\d)\b",
        rf"\b{year}\b"
    ]
    for p in patterns:
        for m in re.findall(p, t, flags=re.I):
            if isinstance(m, tuple):
                m = " ".join(m)
            results.add(m.strip())
    cleaned = []
    for r in results:
        if len(r) == 4 and not r.startswith(("19", "20")):
            continue
        cleaned.append(r)
    return sorted(set(cleaned))

def extract_names(text, segment_label, loc_list=None, job_titles=None):
    if segment_label.lower() != "pi":
        return []
    if any(word in text.lower() for word in ["contact", "details", "references"]):
        return []
    loc_list = loc_list or []
    job_titles = job_titles or []
    cleaned = text.strip()
    lines = cleaned.split("\n")
    header = " ".join(lines[:2])
    name_regex = r"\b([A-Z][a-zA-Z]{1,30}(?: [A-Z][a-zA-Z]{1,30}){0,3})\b"
    header_matches = re.findall(name_regex, header)
    body_matches = re.findall(name_regex, cleaned)
    candidates = list(set(header_matches + body_matches))
    bad_words = {"EDUCATION","EXPERIENCE","EMPLOYMENT","SKILLS","PROJECTS","SUMMARY","CERTIFICATIONS","INTERNSHIPS","CONTACT"}
    final = []
    for n in candidates:
        if n.upper() in bad_words:
            continue
        clean_name = n
        for job in job_titles:
            if job and job.lower() in clean_name.lower():
                pattern = re.compile(re.escape(job), re.IGNORECASE)
                clean_name = pattern.sub("", clean_name).strip()
        if not clean_name:
            continue
        if len(clean_name.split()) < 2:
            continue
        if clean_name in loc_list:
            continue
        if any(loc.lower() in clean_name.lower() for loc in loc_list):
            continue
        clean_name = " ".join(clean_name.split())
        final.append(clean_name)
    seen = set()
    unique_final = []
    for x in final:
        if x not in seen:
            seen.add(x)
            unique_final.append(x)
    return unique_final

def extract_degrees(text, segment_label):
    if segment_label.lower() not in ["edu", "education"]:
        return []
    DEG = r"(BS|B\.?Sc|BA|B\.?Tech|BTech|BE|MS|M\.?Sc|MA|M\.?Tech|MTech|ME|MBA|PhD|P\.?h\.?D|Diploma|Bachelor|Master|Doctor)"
    CONNECT = r"(in|of)"
    MAJOR = r"([A-Za-z][A-Za-z0-9\s&\-]{2,60}?)"
    pattern = rf"\b{DEG}\s+{CONNECT}\s+{MAJOR}(?=[.,\n]|$)"
    matches = re.findall(pattern, text, flags=re.I)
    results = []
    for m in matches:
        degree = m[0].replace(".", "").upper()
        connector = m[1].lower()
        major = re.sub(r"\s{2,}", " ", m[2]).rstrip(".,- ")
        results.append(f"{degree} {connector} {major}")
    return list(set(results))

def extract_companies(segment_text, conll_entities, segment_label):
    text = segment_text.strip()
    orgs = conll_entities.get("ORG", [])
    companies = set()
    COMPANY_SUFFIXES = [
        "Technologies","Technology","Solutions","Labs","Studio","Software",
        "Limited","Ltd","LLC","Inc","Corporation","Corp","Group","Enterprises",
        "Partners","Consulting","Sdn Bhd","Pvt Ltd","Co","Holdings","International"
    ]
    CONTEXT_PATTERNS = [
        r"at ([A-Z][A-Za-z0-9&\-. ]+)",
        r"for ([A-Z][A-Za-z0-9&\-. ]+)",
        r"\| ([A-Z][A-Za-z0-9&\-. ]+)"
    ]
    for suffix in COMPANY_SUFFIXES:
        for m in re.findall(rf"\b([A-Z][A-Za-z0-9&\-. ]*{suffix})\b", text):
            companies.add(m.strip())
    for pat in CONTEXT_PATTERNS:
        for c in re.findall(pat, text):
            companies.add(c.strip())
    for org in orgs:
        if len(org) > 2 and not org.lower().startswith(("tor ", "or ")):
            companies.add(org)
    if segment_label.lower() == "education":
        for m in re.findall(r"\b([A-Z][A-Za-z ]+University)\b", text):
            companies.add(m)
    if segment_label.lower() in ["skills", "pi"]:
        return []
    cleaned = []
    for c in companies:
        c2 = c.strip(" .,-")
        if len(c2) >= 3:
            cleaned.append(c2)
    return list(set(cleaned))

def extract_job_titles(text, segment_label=None):
    if segment_label and segment_label.lower() in ["skills", "education", "edu"]:
        return []
    lines = text.lower().split("\n")
    header = " ".join(lines[:3])
    header_tc = header.title()
    try:
        matches = list(finder.finditer(header_tc))
        extracted = [m.match for m in matches]
    except Exception:
        extracted = []
    merged = extracted
    BAD = ["Providing","Supported","Conducting","Maintaining","Documenting","Analysing","Skills","Projects","History"]
    cleaned = []
    for t in merged:
        if t and " " in t and t not in BAD:
            cleaned.append(t.strip())
    return sorted(set(cleaned))

def find_true_job_title_positions(text, titles):
    positions = []
    DATE_PATTERN = r"(19|20)\d{2}"
    for title in titles:
        for m in re.finditer(re.escape(title), text, flags=re.I):
            start = m.start()
            end = m.end()
            after = text[end:end+60]
            if not re.search(r"\b" + DATE_PATTERN + r"\b", after):
                continue
            if after.strip().lower().startswith("and "):
                continue
            positions.append((start, title))
    positions.sort()
    return positions

def split_experience_blocks(text, titles):
    pos = find_true_job_title_positions(text, titles)
    if not pos:
        return [text]
    blocks = []
    for i in range(len(pos)):
        start = pos[i][0]
        end = pos[i+1][0] if i+1 < len(pos) else len(text)
        blocks.append(text[start:end].strip())
    return blocks

def clean_experience_description(text, job_titles=None, companies=None, dates=None, locations=None):
    if not text:
        return ""
    t = text
    t = re.sub(r"\b(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE)\b", "", t, flags=re.I)
    t = re.sub(r"^[\s•·\-*#&]+", "", t, flags=re.M)
    if job_titles:
        for jt in job_titles:
            if jt:
                t = re.sub(rf"\b{re.escape(jt)}\b", " ", t)
    if companies:
        for c in companies:
            if c:
                t = re.sub(rf"\b{re.escape(c)}\b", " ", t)
    if locations:
        for loc in locations:
            if loc:
                t = t.replace(loc, "")
    month = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"
    year = r"(19[5-9]\d|20[0-4]\d)"
    t = re.sub(rf"{month}\s+{year}", " ", t)
    t = re.sub(rf"{year}\s*[-/]\s*{year}", " ", t)
    t = re.sub(rf"{year}", " ", t)
    t = re.sub(r"(Present|Current|Now)", " ", t, flags=re.I)
    t = re.sub(r"[\r\n]+", " ", t)
    t = re.sub(r"\s{2,}", " ", t).strip()
    sentences = nltk.sent_tokenize(t)
    cleaned = []
    for s in sentences:
        s2 = s.strip().rstrip(",")
        if not s2:
            continue
        if not s2[0].isupper():
            s2 = s2[0].upper() + s2[1:]
        if not s2.endswith("."):
            s2 += "."
        cleaned.append(s2)
    return "\n".join(cleaned)

def extract_experience_blocks(text, label):
    if label.lower() not in ["exp", "experience", "internships"]:
        return []
    titles = extract_job_titles(text, segment_label=label)
    blocks = split_experience_blocks(text, titles)
    experience_entries = []
    for block in blocks:
        conll = extract_conll_entities(block)
        companies = extract_companies(block, conll, label)
        dates = extract_dates(block)
        job_titles = extract_job_titles(block, segment_label=label)
        entry = {
            "title": job_titles[0] if job_titles else "",
            "company": companies[0] if companies else "",
            "location": conll.get("LOC", [])[0] if conll.get("LOC") else "",
            "start_date": dates[0] if dates else "",
            "end_date": dates[1] if len(dates) > 1 else "",
            "description": clean_experience_description(
                block,
                job_titles=job_titles,
                companies=companies,
                dates=dates,
                locations=conll.get("LOC", [])
            )
        }
        if not entry["title"]:
            continue
        experience_entries.append(entry)
    return experience_entries

def extract_certifications(text, segment_label):
    if not segment_label.lower() in ["certifications", "qc"]:
        return ""
    CERT_KEYWORDS = [r"certification", r"certificate", r"qualification", r"training", r"course", r"certified", r"diploma"]
    pattern = re.compile(r"(?:%s).*" % "|".join(CERT_KEYWORDS), re.IGNORECASE)
    match = pattern.search(text)
    cert_text = match.group(0) if match else text
    tokens = cert_text.split()
    certifications = []
    current_title = []
    date_regex = re.compile(r"\b(19|20)\d{2}(?:[-/\s]?(0[1-9]|1[0-2])(?:[-/\s]?(0[1-9]|[12]\d|3[01]))?)?\b")
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if date_regex.match(token):
            title = " ".join(current_title).strip()
            if title:
                certifications.append({"title": title, "date": token})
            current_title = []
        else:
            current_title.append(token)
        i += 1
    if current_title:
        title = " ".join(current_title).strip()
        if title:
            certifications.append({"title": title, "date": None})
    return certifications

def apply_segment_filters(result):
    label = result.get("label", "").lower()
    if label in ["edu", "education"]:
        result["job_titles"] = []
        result["skills"] = []
        result["names"] = []
        result["companies"] = [c for c in result.get("companies", []) if "university" in c.lower()]
        return result
    if label in ["exp", "experience", "internships"]:
        result["degrees"] = []
        result["names"] = []
        result["job_titles"] = [
            t for t in result.get("job_titles", []) if not any(w in t.lower() for w in ["providing","supported","conducting"])
        ]
        result["qualifications"] = []
        return result
    if label == "skills":
        result["job_titles"] = []
        result["companies"] = []
        result["degrees"] = []
        result["names"] = []
        result["locations"] = []
        result["dates"] = []
        result["qualifications"] = []
        return result
    if label == "pi":
        result["skills"] = []
        result["degrees"] = []
        result["job_titles"] = []
        result["companies"] = []
        result["dates"] = [d for d in result.get("dates", []) if len(d) == 4 and d.startswith("20")]
        result["qualifications"] = []
        return result
    if label in ["sum", "summary", "about"]:
        result["companies"] = []
        result["degrees"] = []
        result["job_titles"] = []
        result["names"] = []
        result["qualifications"] = []
        return result
    if label in ["qc"]:
        result["job_titles"] = []
        result["companies"] = []
        result["degrees"] = []
        result["skills"] = []
        result["names"] = []
        result["locations"] = []
        result["dates"] = []
        return result
    return result

def normalize_output(all_segments):
    final = {"name": "", "email": "", "phone": "", "location": "", "summary": "", "skills": set(), "experience": [], "education": [], "certifications": []}
    pi_emails = []
    pi_phones = []
    pi_locations = []
    for seg in all_segments:
        label = seg.get("label", "").lower()
        if label in ["sum", "summary", "about"]:
            final["summary"] += " " + seg.get("raw_text", "")
        for sk in seg.get("skills", []):
            if sk and len(sk) > 1:
                final["skills"].add(sk)
        if label == "pi":
            if seg.get("emails"): pi_emails.append(seg.get("emails"))
            if seg.get("phones"): pi_phones.append(seg.get("phones"))
            if seg.get("locations"): pi_locations.extend(seg.get("locations", []))
        if label in ["exp", "experience", "internships"]:
            for e in seg.get("experience_blocks", []):
                final["experience"].append(e)
        if label in ["edu", "education"]:
            final["education"].append({
                "degree": seg.get("degrees", [""])[0] if seg.get("degrees") else "",
                "major": "",
                "school": seg.get("companies", [""])[0] if seg.get("companies") else "",
                "location": seg.get("locations", [""])[0] if seg.get("locations") else "",
                "year": seg.get("dates", [""])[0] if seg.get("dates") else ""
            })
        if seg.get("certifications"):
            for q in seg.get("certifications", []):
                final["certifications"].append({"title": q.get("title", ""), "date": q.get("date", "")})
        if label == "pi":
            if seg.get("names"):
                pi_name = sorted(seg.get("names"), key=lambda x: len(x.split()), reverse=True)[0]
                final["name"] = pi_name
    if pi_emails:
        final["email"] = pi_emails[0]
    if pi_phones:
        final["phone"] = pi_phones[0]
    if pi_locations:
        final["location"] = pi_locations[0]
    final["skills"] = sorted(list(final["skills"]))
    return final

def run_segment_ner(segment):
    text = segment.get("text", "")
    label = segment.get("label", "")
    conll_entities = extract_conll_entities(text)
    conll_loc = conll_entities.get("LOC", [])
    skills = extract_skills_skillner(text)
    email = extract_email(text)
    phone = extract_phone(text)
    dates = extract_dates(text)
    degrees = extract_degrees(text, segment_label=label)
    companies = extract_companies(text, conll_entities, label)
    job_titles = extract_job_titles(text, segment_label=label)
    certifications = extract_certifications(text, segment_label=label)
    names = extract_names(text, segment_label=label, loc_list=conll_loc, job_titles=job_titles)
    result = {
        "segment_id": segment.get("segment_id"),
        "label": label,
        "names": conll_entities.get("PER", []) or names,
        "companies": companies,
        "locations": conll_loc,
        "skills": skills,
        "job_titles": job_titles,
        "degrees": degrees,
        "emails": email,
        "phones": phone,
        "dates": dates,
        "certifications": certifications,
        "raw_text": text
    }
    if label.lower() in ["exp", "experience", "internships"]:
        result["experience_blocks"] = extract_experience_blocks(text, label)
    else:
        result["experience_blocks"] = []
    result = apply_segment_filters(result)
    return result

def run_full_resume_pipeline(classified_segments):
    clean_segments = []
    for seg in classified_segments:
        r = run_segment_ner(seg)
        clean_segments.append(r)
    final_resume = normalize_output(clean_segments)
    return final_resume
