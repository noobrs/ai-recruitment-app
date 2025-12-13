import re
from typing import List, Optional

from gliner import GLiNER

from api.pdf.config import GLINER_MODEL_NAME, DEGREE_RES
from api.types.types import TextGroup, EducationOut, ExperienceOut, CertificationOut, ActivityOut


# =============================================================================
# Model Loading
# =============================================================================

ner_model = None

def load_ner_model():
    global ner_model
    
    if ner_model is not None:
        return ner_model
    
    print(f"[GLiNER] Loading model: {GLINER_MODEL_NAME}")
    ner_model = GLiNER.from_pretrained(GLINER_MODEL_NAME)
    print("[GLiNER] Model loaded successfully.")
    return ner_model


# =============================================================================
# Helpers
# =============================================================================

def split_text_by_headers(full_text: str, headers: List[str]) -> List[str]:
    # 1. Find the starting index of each header in the text
    found_headers = []
    
    for header in headers:
        index = full_text.find(header)
        if index != -1: # -1 means the header was not found
            found_headers.append((index, header))
    
    # 2. Sort the found headers by their index (position in text)
    # This ensures we process the text in the correct order
    found_headers.sort(key=lambda x: x[0])
    
    result = []
    
    # 3. Loop through the sorted headers and slice the text
    for i in range(len(found_headers)):
        current_start_index = found_headers[i][0]
        
        # Determine the end index:
        # If this is the last header, the end is the length of the full text
        # Otherwise, the end is the start of the NEXT header
        if i < len(found_headers) - 1:
            next_start_index = found_headers[i+1][0]
        else:
            next_start_index = len(full_text)
            
        # Extract the segment
        segment = full_text[current_start_index:next_start_index]
        
        # Optional: .strip() removes extra spaces or newlines at start/end
        # .rstrip(',') removes trailing commas if necessary
        clean_segment = segment.strip().rstrip(',')
        
        result.append(clean_segment)
        
    return result


def find_first_occurring_string(full_text: str, string_list: List[str]) -> str:
    first_string = None
    min_index = len(full_text) # Start with a max index value

    for search_str in string_list:
        index = full_text.find(search_str)
        
        # If the string is found (index != -1) AND it's earlier than what we found so far
        if index != -1 and index < min_index:
            min_index = index
            first_string = search_str
            
    return first_string


def extract_date_context(full_text: str, date_list: List[str]) -> Optional[str]:
    if not date_list or not full_text:
        return None

    # Common separators (hyphen, en-dash, 'to')
    sep_pattern = r"\s*(?:-|–|to)\s*"

    # SCENARIO 1: List contains exactly one date
    if len(date_list) == 1:
        target_date = re.escape(date_list[0])
        
        # 1. Check for "Date - Present/Now/Current"
        present_pattern = f"({target_date}{sep_pattern}(?:present|current|now))"
        match = re.search(present_pattern, full_text, re.IGNORECASE)
        if match:
            return match.group(1)
            
        # 2. Check for "Expected Graduation: Date" or "Est: Date"
        context_keywords = r"(?:expected graduation|graduating|est\.?|class of)"
        context_pattern = f"({context_keywords}:?\s*{target_date})"
        match = re.search(context_pattern, full_text, re.IGNORECASE)
        if match:
            return match.group(1)
            
        # 3. Fallback: If the date exists in text but has no context, return just the date
        if target_date.lower() in full_text.lower():
            return date_list[0]

    # SCENARIO 2: List contains two dates
    elif len(date_list) >= 2:
        # We take the first two dates to form a range
        start_date = re.escape(date_list[0])
        end_date = re.escape(date_list[1])
        
        # Check for "Start - End"
        # Matches: "2025 - 2026", "Jan 2025 to Feb 2026"
        range_pattern = f"({start_date}{sep_pattern}{end_date})"
        match = re.search(range_pattern, full_text, re.IGNORECASE)
        if match:
            return match.group(1)

    return None


def parse_date_string_to_pair(date_string: str) -> List[Optional[str]]:
    if not date_string:
        return [None, None]

    # Normalize string: lowercase and remove extra spaces
    clean_text = date_string.strip()
    
    # 1. Handle "Present" / "Current" cases
    # Matches: "Jan 2025 - Present", "2024 to Now"
    present_pattern = r"(.*?)\s*(?:-|–|to)\s*(present|current|now)"
    match_present = re.search(present_pattern, clean_text, re.IGNORECASE)
    if match_present:
        start_part = match_present.group(1).strip()
        return [start_part, "Present"]

    # 2. Handle standard ranges "Date - Date"
    # Matches: "2020 - 2022", "Jan 2024 to Feb 2025"
    # We split by the separator, but only if it looks like a separator between two data points
    sep_pattern = r"\s+(?:-|–|to)\s+"
    parts = re.split(sep_pattern, clean_text)
    
    if len(parts) == 2:
        return [parts[0].strip(), parts[1].strip()]

    # 3. Handle "Expected Graduation" / Single Date context
    # We want to remove the noise words and extract just the date.
    
    # Noise words to remove
    noise_pattern = r"(?:expected graduation[:\s]*|graduating[:\s]*|est\.?[:\s]*|class of[:\s]*)"
    
    # Remove the noise, leaving only the date
    cleaned_date = re.sub(noise_pattern, "", clean_text, flags=re.IGNORECASE).strip()
    
    # If the input was "Expected Graduation: May 2026", cleaned_date is "May 2026".
    # Since this is a specific point in time (usually an end goal), 
    # we can return it as the End Date, or just a single date.
    # LOGIC DECISION: If it explicitly says "Graduation", it is usually an End Date.
    if re.search(r"graduation|graduating|class of", clean_text, re.IGNORECASE):
        return [None, cleaned_date]

    # 4. Default Fallback (Standard single date)
    # If it's just "Jan 2025", we treat it as a start date (or a single point).
    return [cleaned_date, None]


def clean_and_remove_target(full_string: str, target_string: str) -> str:
    if not full_string:
        return ""
    
    # 1. Remove the target string
    temp_text = full_string.replace(target_string, "")
    
    # 2. Strip standard whitespace first
    #    This ensures "  | abc  " becomes "| abc" so our regex can work on the edges
    temp_text = temp_text.strip()
    
    # 3. Apply the specific regex rules:
    #    Rule A (Leading): (^[^\w\s]+\s+)
    #          - Start (^) -> Symbols ([^\w\s]+) -> Space (\s+)
    #          - Matches "| abc" -> Removes "| "
    #          - Ignores "(abc"
    #
    #    Rule B (Trailing): (\s+[^\w\s]+$)
    #          - Space (\s+) -> Symbols ([^\w\s]+) -> End ($)
    #          - Matches "abc !" -> Removes " !"
    #          - Ignores "abc!"
    
    clean_text = re.sub(r"(^[^\w\s]+\s+)|(\s+[^\w\s]+$)", "", temp_text)
    
    return clean_text.strip()


def is_valid_degree(text: str) -> bool:
    if not text:
        return False
    
    text = text.strip()
    
    # Too short to be a degree
    if len(text) < 3:
        return False
    
    # Check against degree patterns
    for pattern in DEGREE_RES:
        if pattern.search(text):
            return True
    
    return False


def is_skill_sentence(text: str) -> bool:
    if not text:
        return False
    
    if text.count(',') > 1 or text.count(':') > 0:
        return True
    
    return False


# =============================================================================
# Skills Building
# =============================================================================

def build_skills(groups: List[TextGroup]) -> List[str]:
    skill_groups = [group for group in groups if group.heading == "skills"]
    
    if not skill_groups:
        print("[build_skills] No 'skills' section found in groups")
        return []
    
    skill_group = skill_groups[0]
    skills = []
    ner_model = load_ner_model()

    for span in skill_group.spans:
        if span.label == "list_item" and not is_skill_sentence(span.text):
            skills.append(span.text.strip())
            print(f"      • [list_item] \"{span.text.strip()}\"")
        else:
            entities = ner_model.predict_entities(span.text, ["skill", "tool", "language"])
            for entity in entities:
                skills.append(entity['text'].strip())
                print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")

    return skills


# =============================================================================
# Education Building
# =============================================================================

def build_educations(groups: List[TextGroup]) -> List[EducationOut]:
    edu_group = [group for group in groups if group.heading == "education"]
    if not edu_group:
        return []
    edu_group = edu_group[0]
    edu_text = edu_group.text

    ner_model = load_ner_model()
    entities = ner_model.predict_entities(edu_text, ["academic degree", "school", "university", "organization"])
    for entity in entities:
        print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")

    print(f"\n\n[Degree Validation] Checking extracted degrees...")
    # Create a new list for valid entities
    valid_entities = []

    for entity in entities:
        # If it's a degree, run the validation check
        if entity['label'] == "academic degree":
            if is_valid_degree(entity['text']):
                valid_entities.append(entity)
            else:
                # Optional: Log that we dropped it
                print(f"Dropped invalid degree: {entity['text']}")
                
        # If it's NOT a degree (e.g., school, org), keep it automatically
        else:
            valid_entities.append(entity)

    # Replace the old list with the filtered one
    entities = valid_entities

    degrees = [e["text"] for e in entities if e['label'] == 'academic degree']
    schools = [e["text"] for e in entities if e['label'] in {'school', 'university', 'organization'}]

    degrees_len = len(degrees)
    schools_len = len(schools)

    # 1. Determine if we have multiple records or just one
    # (Your existing logic determines `records` list)
    if degrees_len == schools_len and degrees_len > 1:
        print(f"Detected multiple entries. Splitting by headers...")
        first_degree_text = degrees[0]
        first_school_text = schools[0]
        
        # Determine which appears first to decide the split strategy
        first_occur = find_first_occurring_string(edu_group.text, [first_degree_text, first_school_text])
        
        # Split the text
        records = split_text_by_headers(edu_group.text, degrees if first_occur == first_degree_text else schools)
    else:
        # Fallback: If we couldn't split cleanly, treat the entire section as one record
        records = [edu_group.text]

    final_education_entries = []

    # 2. Process each record to build the Object
    for record in records:
        # Re-run NER on this specific segment to get precise associations
        segment_entities = ner_model.predict_entities(
            record, 
            ["academic degree", "school", "university", "organization", "location", "date"]
        )
        
        # Initialize a temporary dictionary to hold our best candidates
        current_data = {
            "degree": None,
            "institution": None,
            "location": None,
            "start_date": None,
            "end_date": None,
            "description": None
        }

        # Helper lists to catch dates
        dates_found = []
        clean_desc = ""

        for entity in segment_entities:
            label = entity['label']
            text = entity['text']
            
            # Simple heuristic: Pick the first valid occurrence of each type in this segment
            if label == "academic degree" and not current_data["degree"]:
                if is_valid_degree(text):
                    current_data["degree"] = text
                    clean_desc = clean_and_remove_target(record, text)
            
            elif label in ["school", "university", "organization"] and not current_data["institution"]:
                current_data["institution"] = text
                clean_desc = clean_and_remove_target(clean_desc, text)
                
            elif label == "location" and not current_data["location"]:
                current_data["location"] = text
                clean_desc = clean_and_remove_target(clean_desc, text)
                
            elif label == "date":
                dates_found.append(text)

        # 3. Handle Dates
        extract_date_context_result = extract_date_context(record, dates_found)
        start_date, end_date = parse_date_string_to_pair(extract_date_context_result)
        clean_desc = clean_and_remove_target(clean_desc, extract_date_context_result) if extract_date_context_result else clean_desc

        current_data["start_date"] = start_date
        current_data["end_date"] = end_date

        current_data["description"] = clean_desc

        # 4. Create the Pydantic Object
        edu_entry = EducationOut(**current_data)
        final_education_entries.append(edu_entry)
    return final_education_entries


# =============================================================================
# Experience Building
# =============================================================================

def build_experiences(groups: List[TextGroup]) -> List[ExperienceOut]:
    exp_groups = [group for group in groups if group.heading == "experience"]
    
    if not exp_groups:
        print("[build_experiences] No 'experience' section found in groups")
        return []
    
    exp_group = exp_groups[0]
    exp_text = exp_group.text
    ner_model = load_ner_model()

    entities = ner_model.predict_entities(exp_text, ["job title", "company", "organization"])
    for entity in entities:
        print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")

    # Print results to verify
    print(f"\n[Final List] {len(entities)} entities remaining:")
    for entity in entities:
        print(f"   • [{entity['label']}] \"{entity['text']}\"")

    job_titles = [e["text"] for e in entities if e['label'] == 'job title']
    companies = [e["text"] for e in entities if e['label'] in {'company', 'organization'}]

    job_titles_len = len(job_titles)
    companies_len = len(companies)
    
    # 1. Determine if we have multiple records or just one
    # (Your existing logic determines `records` list)
    if job_titles_len == companies_len and job_titles_len > 1:
        print(f"Detected multiple entries. Splitting by headers...")
        first_job_title_text = job_titles[0]
        first_company_text = companies[0]
        
        # Determine which appears first to decide the split strategy
        first_occur = find_first_occurring_string(exp_group.text, [first_job_title_text, first_company_text])
        
        # Split the text
        records = split_text_by_headers(exp_group.text, job_titles if first_occur == first_job_title_text else companies)
    else:
        # Fallback: If we couldn't split cleanly, treat the entire section as one record
        records = [exp_group.text]

    final_experience_entries = []

    # 2. Process each record to build the Object
    for record in records:
        # Re-run NER on this specific segment to get precise associations
        segment_entities = ner_model.predict_entities(
            record, 
            ["job title", "company", "organization", "location", "date"]
        )
        
        # Initialize a temporary dictionary to hold our best candidates
        current_data = {
            "job_title": None,
            "company": None,
            "location": None,
            "start_date": None,
            "end_date": None,
            "description": None
        }

        # Helper lists to catch dates
        dates_found = []
        clean_desc = ""

        for entity in segment_entities:
            label = entity['label']
            text = entity['text']
            
            # Simple heuristic: Pick the first valid occurrence of each type in this segment
            if label == "job title" and not current_data["job_title"]:
                current_data["job_title"] = text
                clean_desc = clean_and_remove_target(record, text)
            
            elif label in ["company", "organization"] and not current_data["company"]:
                current_data["company"] = text
                clean_desc = clean_and_remove_target(clean_desc, text)
                
            elif label == "location" and not current_data["location"]:
                current_data["location"] = text
                clean_desc = clean_and_remove_target(clean_desc, text)
                
            elif label == "date":
                dates_found.append(text)

        # 3. Handle Dates
        extract_date_context_result = extract_date_context(record, dates_found)
        start_date, end_date = parse_date_string_to_pair(extract_date_context_result)
        clean_desc = clean_and_remove_target(clean_desc, extract_date_context_result) if extract_date_context_result else clean_desc

        current_data["start_date"] = start_date
        current_data["end_date"] = end_date

        current_data["description"] = clean_desc

        # 4. Create the Pydantic Object
        exp_entry = ExperienceOut(**current_data)
        final_experience_entries.append(exp_entry)

    return final_experience_entries


# =============================================================================
# Certifications Building
# =============================================================================

# --- Process Certifications ---
def build_certifications(groups: List[TextGroup]) -> List[CertificationOut]:
    cert_groups = [group for group in groups if group.heading == "certifications" or group.heading == "awards"]
    cert_out = []

    if not cert_groups:
        return cert_out
    
    ner_model = load_ner_model()

    for cert_group in cert_groups:
        print(f"• Certification/Award Record: {cert_group.text}")
        
        # 1. Extract entities
        entities = ner_model.predict_entities(cert_group.text, ["certification", "description"])
        
        # 2. Prepare temporary placeholders
        found_name = None
        found_descriptions = []

        for entity in entities:
            print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")
            
            # Map labels to Pydantic fields
            if entity['label'] == "certification":
                # If we already found a name, this group might contain multiple items. 
                # For simplicity, we stick to the first one or you can create a new logic to split them.
                if not found_name: 
                    found_name = entity['text']
            elif entity['label'] == "description":
                found_descriptions.append(entity['text'])

        # 3. Build the object if valid data exists
        # Fallback: if no specific "certification" entity was found, but the group exists,
        # you might sometimes want to use the raw text or skip. Here we skip if no name is found.
        if found_name:
            cert_obj = CertificationOut(
                name=found_name,
                description=" ".join(found_descriptions) if found_descriptions else None
            )
            cert_out.append(cert_obj)
    return cert_out


# =============================================================================
# Activities Building
# =============================================================================

def build_activities(groups: List[TextGroup]) -> List[ActivityOut]:
    act_groups = [group for group in groups if group.heading == "activities" or group.heading == "projects"]
    act_out = []
    if not act_groups:
        return act_out
    
    for act_group in act_groups:
        print(f"• Activity/Project Record: {act_group.text}")

        # 1. Extract entities
        entities = ner_model.predict_entities(act_group.text, ["project", "activity", "title", "description"])
        
        # 2. Prepare temporary placeholders
        found_name = None
        found_descriptions = []

        for entity in entities:
            print(f"      • [{entity['label']}] \"{entity['text']}\" (Score: {entity['score']:.2f})")

            # Map labels to Pydantic fields
            # 'project', 'activity', and 'title' all act as the 'name' of the entry
            if entity['label'] in ["project", "activity", "title"]:
                if not found_name:
                    found_name = entity['text']
            elif entity['label'] == "description":
                found_descriptions.append(entity['text'])

        # 3. Build the object
        if found_name:
            act_obj = ActivityOut(
                name=found_name,
                description=" ".join(found_descriptions) if found_descriptions else None
            )
            act_out.append(act_obj)
    return act_out