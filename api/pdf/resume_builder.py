"""
Build structured resume data from classified sections and extracted entities.
Handles multiple education and experience records carefully.
"""

from typing import Dict, List, Optional, Tuple

from api.pdf.config import TEXT_WINDOW_RADIUS
from api.pdf.models import (
    ActivityRecord,
    CertificationRecord,
    EducationRecord,
    Entity,
    ExperienceRecord,
    TextGroup,
)
from api.pdf.utils import (
    clean_description,
    deduplicate_by_key,
    deduplicate_strings,
    entities_in_window,
    extract_date_from_entities,
    get_entity_texts,
    make_text_window,
    normalize_key,
    remove_fields_from_description,
)
from api.pdf.validators import is_valid_degree, is_valid_date


# =============================================================================
# Skills Building
# =============================================================================

def build_skills(groups: List[TextGroup]) -> List[str]:
    """
    Extract and aggregate skill entities from all groups.
    Prioritizes skills sections but includes skills from other sections.
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        List of unique skills, sorted by confidence
    """
    skills_scores: Dict[str, float] = {}
    
    for group in groups:
        # Skip NO_HEADING without section type
        if group.heading == "NO_HEADING" and group.section_type is None:
            continue
        
        for entity in group.entities:
            if entity.label.lower() in ("skill", "language"):
                key = normalize_key(entity.text)
                if key and len(entity.text.strip()) >= 2:
                    # Keep highest score
                    if key not in skills_scores or entity.score > skills_scores[key]:
                        skills_scores[key] = entity.score
    
    # Sort by score and return original texts
    sorted_items = sorted(skills_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Reconstruct original texts (capitalize first letter)
    return [key.title() if key.islower() else key for key, _ in sorted_items]


# =============================================================================
# Education Building
# =============================================================================

def build_education(groups: List[TextGroup]) -> List[EducationRecord]:
    """
    Build education records from classified education sections.
    Handles multiple degrees within a single section.
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        List of EducationRecord objects
    """
    records = []
    
    for group in groups:
        if group.heading == "NO_HEADING":
            continue
        
        # Check if this is an education section
        is_education = group.section_type == "education"
        
        # Also check for degree entities
        degree_entities = [e for e in group.entities if e.label.lower() == "degree"]
        
        if not is_education and not degree_entities:
            continue
        
        # Build records for this group
        group_records = _build_education_records_from_group(group, degree_entities)
        records.extend(group_records)
    
    # Filter records without a degree
    records = [r for r in records if r.degree]
    
    # Deduplicate
    record_dicts = [r.to_dict() for r in records]
    unique_dicts = deduplicate_by_key(
        record_dicts,
        ("degree", "institution", "start_date", "end_date"),
    )
    
    return [
        EducationRecord(
            degree=d.get("degree"),
            institution=d.get("institution"),
            location=d.get("location"),
            start_date=d.get("start_date"),
            end_date=d.get("end_date"),
            description=d.get("description"),
        )
        for d in unique_dicts
    ]


def _build_education_records_from_group(
    group: TextGroup,
    degree_entities: List[Entity],
) -> List[EducationRecord]:
    """
    Build education records from a single group.
    Creates separate records for each degree found.
    
    Args:
        group: TextGroup object
        degree_entities: List of degree entities found in this group
        
    Returns:
        List of EducationRecord objects
    """
    if not degree_entities:
        # No specific degrees found, create one record for the whole group
        return [_build_single_education_record(group, group.entities, None)]
    
    records = []
    
    for degree_entity in degree_entities:
        # Validate degree
        if not is_valid_degree(degree_entity.text):
            continue
        
        # Create text window around this degree
        window_text, w_start, w_end = make_text_window(
            group.text,
            degree_entity.start_char,
            degree_entity.end_char,
            radius=TEXT_WINDOW_RADIUS,
        )
        
        # Get entities within this window
        local_entities = entities_in_window(group.entities, w_start, w_end)
        
        record = _build_single_education_record(
            group,
            local_entities,
            degree_entity.text.strip(),
            window_text,
        )
        records.append(record)
    
    return records


def _build_single_education_record(
    group: TextGroup,
    entities: List[Entity],
    degree: Optional[str] = None,
    context_text: Optional[str] = None,
) -> EducationRecord:
    """
    Build a single education record from entities.
    
    Args:
        group: Parent TextGroup
        entities: Entities to extract from
        degree: Pre-extracted degree text (optional)
        context_text: Text context for this record (optional)
        
    Returns:
        EducationRecord object
    """
    text = context_text or group.text
    
    # Extract degree if not provided
    if degree is None:
        degree_texts = get_entity_texts(entities, "degree")
        for dt in degree_texts:
            if is_valid_degree(dt):
                degree = dt.strip()
                break
    
    # Extract institution (school, university, organization)
    institution = None
    for label in ["school", "university", "organization"]:
        texts = get_entity_texts(entities, label)
        if texts:
            institution = texts[0].strip()
            break
    
    # Extract location
    locations = get_entity_texts(entities, "location")
    location = locations[0].strip() if locations else None
    
    # Extract dates
    start_date, end_date = extract_date_from_entities(entities)
    
    # Validate dates
    if start_date and not is_valid_date(start_date):
        start_date = None
    if end_date and not is_valid_date(end_date):
        end_date = None
    
    # Build description (remove extracted fields)
    fields_to_remove = [
        group.heading if group.heading != "NO_HEADING" else None,
        degree,
        institution,
        location,
        start_date,
        end_date,
    ]
    fields_to_remove = [f for f in fields_to_remove if f]
    
    description = remove_fields_from_description(text, fields_to_remove)
    
    return EducationRecord(
        degree=degree,
        institution=institution,
        location=location,
        start_date=start_date,
        end_date=end_date,
        description=description if description else None,
    )


# =============================================================================
# Experience Building
# =============================================================================

def build_experience(groups: List[TextGroup]) -> List[ExperienceRecord]:
    """
    Build experience records from classified experience sections.
    Handles multiple job titles within a single section.
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        List of ExperienceRecord objects
    """
    records = []
    
    for group in groups:
        if group.heading == "NO_HEADING":
            continue
        
        # Check if this is an experience section
        is_experience = group.section_type == "experience"
        
        # Also check for job title entities
        title_entities = [e for e in group.entities if e.label.lower() == "job title"]
        
        if not is_experience and not title_entities:
            continue
        
        # Build records for this group
        group_records = _build_experience_records_from_group(group, title_entities)
        records.extend(group_records)
    
    # Filter records without a job title
    records = [r for r in records if r.job_title]
    
    # Deduplicate
    record_dicts = [r.to_dict() for r in records]
    unique_dicts = deduplicate_by_key(
        record_dicts,
        ("job_title", "company", "start_date", "end_date"),
    )
    
    return [
        ExperienceRecord(
            job_title=d.get("job_title"),
            company=d.get("company"),
            location=d.get("location"),
            start_date=d.get("start_date"),
            end_date=d.get("end_date"),
            description=d.get("description"),
        )
        for d in unique_dicts
    ]


def _build_experience_records_from_group(
    group: TextGroup,
    title_entities: List[Entity],
) -> List[ExperienceRecord]:
    """
    Build experience records from a single group.
    Creates separate records for each job title found.
    
    Args:
        group: TextGroup object
        title_entities: List of job title entities
        
    Returns:
        List of ExperienceRecord objects
    """
    if not title_entities:
        # No specific titles found, create one record for the whole group
        return [_build_single_experience_record(group, group.entities, None)]
    
    records = []
    
    for title_entity in title_entities:
        # Create text window around this title
        window_text, w_start, w_end = make_text_window(
            group.text,
            title_entity.start_char,
            title_entity.end_char,
            radius=TEXT_WINDOW_RADIUS,
        )
        
        # Get entities within this window
        local_entities = entities_in_window(group.entities, w_start, w_end)
        
        record = _build_single_experience_record(
            group,
            local_entities,
            title_entity.text.strip(),
            window_text,
        )
        records.append(record)
    
    return records


def _build_single_experience_record(
    group: TextGroup,
    entities: List[Entity],
    job_title: Optional[str] = None,
    context_text: Optional[str] = None,
) -> ExperienceRecord:
    """
    Build a single experience record from entities.
    
    Args:
        group: Parent TextGroup
        entities: Entities to extract from
        job_title: Pre-extracted job title (optional)
        context_text: Text context for this record (optional)
        
    Returns:
        ExperienceRecord object
    """
    text = context_text or group.text
    
    # Extract job title if not provided
    if job_title is None:
        titles = get_entity_texts(entities, "job title")
        if titles:
            job_title = titles[0].strip()
    
    # Extract company (company, organization)
    company = None
    for label in ["company", "organization"]:
        texts = get_entity_texts(entities, label)
        if texts:
            company = texts[0].strip()
            break
    
    # Extract location
    locations = get_entity_texts(entities, "location")
    location = locations[0].strip() if locations else None
    
    # Extract dates
    start_date, end_date = extract_date_from_entities(entities)
    
    # Validate dates
    if start_date and not is_valid_date(start_date):
        start_date = None
    if end_date and not is_valid_date(end_date):
        end_date = None
    
    # Build description
    fields_to_remove = [
        group.heading if group.heading != "NO_HEADING" else None,
        job_title,
        company,
        location,
        start_date,
        end_date,
    ]
    fields_to_remove = [f for f in fields_to_remove if f]
    
    description = remove_fields_from_description(text, fields_to_remove)
    
    return ExperienceRecord(
        job_title=job_title,
        company=company,
        location=location,
        start_date=start_date,
        end_date=end_date,
        description=description if description else None,
    )


# =============================================================================
# Certifications Building
# =============================================================================

def build_certifications(groups: List[TextGroup]) -> List[CertificationRecord]:
    """
    Build certification records from classified certification sections.
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        List of CertificationRecord objects
    """
    records = []
    seen_names = set()
    
    for group in groups:
        if group.heading == "NO_HEADING":
            continue
        
        if group.section_type != "certifications":
            continue
        
        # Extract certification entities
        cert_entities = [e for e in group.entities if e.label.lower() == "certification"]
        
        if cert_entities:
            # Build from entities
            for entity in cert_entities:
                name = entity.text.strip()
                name_key = normalize_key(name)
                
                if name_key in seen_names:
                    continue
                seen_names.add(name_key)
                
                # Try to find organization and date nearby
                org_texts = get_entity_texts(group.entities, "organization")
                date_texts = get_entity_texts(group.entities, "date")
                
                records.append(CertificationRecord(
                    name=name,
                    organization=org_texts[0] if org_texts else None,
                    date=date_texts[0] if date_texts else None,
                    description=None,
                ))
        else:
            # Fallback: extract from text lines
            for line in group.text.splitlines():
                line = line.strip()
                if len(line) >= 4:
                    name_key = normalize_key(line)
                    if name_key in seen_names:
                        continue
                    seen_names.add(name_key)
                    
                    records.append(CertificationRecord(
                        name=line,
                        organization=None,
                        date=None,
                        description=line,
                    ))
    
    return records


# =============================================================================
# Activities Building
# =============================================================================

def build_activities(groups: List[TextGroup]) -> List[ActivityRecord]:
    """
    Build activity/project records from classified sections.
    
    Args:
        groups: List of classified TextGroup objects
        
    Returns:
        List of ActivityRecord objects
    """
    records = []
    
    for group in groups:
        if group.heading == "NO_HEADING":
            continue
        
        if group.section_type not in ("activities", "projects"):
            continue
        
        text = (group.text or "").strip()
        if not text:
            continue
        
        # Extract name from first line or activity entities
        name = None
        activity_entities = [e for e in group.entities if e.label.lower() in ("activity", "project")]
        
        if activity_entities:
            name = activity_entities[0].text.strip()
        else:
            # Use first line as name
            first_line = text.splitlines()[0].strip() if text else None
            name = first_line
        
        # Clean description
        description = clean_description(text)
        
        records.append(ActivityRecord(
            name=name,
            description=description if description else None,
        ))
    
    return records

