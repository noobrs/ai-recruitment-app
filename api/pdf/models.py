"""
Data models for PDF resume extraction pipeline.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class BoundingBox:
    """Bounding box coordinates for redaction.
    
    Used throughout the pipeline to track the spatial position of text elements in the PDF.
    Created during PDF layout extraction and used for:
    - Mapping extracted text back to PDF coordinates
    - Identifying regions to redact for anonymization
    """
    page_index: int
    x0: float
    y0: float
    x1: float
    y1: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_index": self.page_index,
            "x0": self.x0,
            "y0": self.y0,
            "x1": self.x1,
            "y1": self.y1,
        }

    def to_tuple(self) -> tuple:
        """Return bbox as (x0, y0, x1, y1) tuple."""
        return (self.x0, self.y0, self.x1, self.y1)


@dataclass
class TextSegment:
    """A segment of text with its position and metadata.
    
    Used during PDF layout extraction to represent individual text chunks detected by the layout model.
    Each segment contains the text content, its visual type (title, text, list, etc.), and position.
    These segments are later grouped by headings and sections in the processing pipeline.
    """
    text: str
    label: str  # Layout label (e.g., "text", "title", etc.)
    bbox: Optional[BoundingBox] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "label": self.label,
            "bbox": self.bbox.to_dict() if self.bbox else None,
        }


@dataclass
class Entity:
    """An extracted entity with position and confidence.
    
    Used during Named Entity Recognition (NER) to represent detected entities like names, 
    organizations, locations, dates, etc. Created by the NER model and stored in TextGroups 
    to provide structured information about resume content.
    """
    text: str
    label: str
    score: float
    start_char: int = -1
    end_char: int = -1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "label": self.label,
            "score": self.score,
            "start_char": self.start_char,
            "end_char": self.end_char,
        }


@dataclass
class HeadingGroup:
    """A group of text organized by original heading from PDF layout.
    
    Used after layout extraction to organize TextSegments under their visual headings.
    This is an intermediate representation before section classification - the heading is the 
    raw text from the PDF (e.g., "Work History"), which will later be classified into 
    standardized section types (e.g., "experience").
    """
    heading: str  # Original heading text (or "NO_HEADING")
    text: str  # Combined text: "heading\ntext content..." for classification
    segments: List[TextSegment] = field(default_factory=list)  # Original segments with coordinates

    def to_dict(self) -> Dict[str, Any]:
        return {
            "heading": self.heading,
            "text": self.text,
            "segments": [s.to_dict() for s in self.segments],
        }


@dataclass
class TextGroup:
    """A group of text organized by section label (classified heading).
    
    Used after section classification to organize text by standardized resume sections.
    Created by classifying HeadingGroups into standard categories (education, experience, skills, etc.).
    Contains the original segments with coordinates plus extracted entities for structured parsing.
    These groups are then parsed to extract structured records (EducationRecord, ExperienceRecord, etc.).
    """
    heading: str  # Section label (e.g., "education", "experience") from classification
    text: str  # Combined text content
    segments: List[TextSegment] = field(default_factory=list)  # Original segments with coordinates
    entities: List[Entity] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "heading": self.heading,
            "text": self.text,
            "segments": [s.to_dict() for s in self.segments],
            "entities": [e.to_dict() for e in self.entities],
        }


@dataclass
class RedactionRegion:
    """A region to be redacted in the PDF.
    
    Used during the anonymization/redaction phase to mark areas that should be redacted.
    Created by the PersonExtractor when identifying PII (Personally Identifiable Information).
    Stored in PersonInfo and used to generate the anonymized PDF output.
    """
    page_index: int
    bbox: tuple  # (x0, y0, x1, y1)
    info_type: str  # 'name', 'email', 'phone', 'location', 'face'

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_index": self.page_index,
            "bbox": self.bbox,
            "info_type": self.info_type,
        }


@dataclass
class PersonInfo:
    """Extracted person information for redaction.
    
    Used by PersonExtractor to collect all PII found in the resume.
    Created early in the pipeline by extracting personal details from TextGroups and entities.
    Serves dual purposes:
    1. Provides structured contact information for the final ExtractedResume
    2. Contains redaction regions for generating anonymized PDFs
    """
    names: List[str] = field(default_factory=list)
    emails: List[str] = field(default_factory=list)
    phones: List[str] = field(default_factory=list)
    locations: List[str] = field(default_factory=list)
    redaction_regions: List[RedactionRegion] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "names": self.names,
            "emails": self.emails,
            "phones": self.phones,
            "locations": self.locations,
            "redaction_regions": [r.to_dict() for r in self.redaction_regions],
        }

    @property
    def primary_name(self) -> Optional[str]:
        return self.names[0] if self.names else None

    @property
    def primary_email(self) -> Optional[str]:
        return self.emails[0] if self.emails else None

    @property
    def primary_phone(self) -> Optional[str]:
        return self.phones[0] if self.phones else None

    @property
    def primary_location(self) -> Optional[str]:
        return self.locations[0] if self.locations else None


@dataclass
class EducationRecord:
    """A single education record.
    
    Used by ResumeBuilder to represent a parsed education entry.
    Created by parsing TextGroups labeled as "education" section, extracting structured 
    information from entities and text patterns. Multiple records may exist if the resume 
    contains multiple degrees or educational experiences.
    """
    degree: Optional[str] = None
    institution: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "degree": self.degree,
            "institution": self.institution,
            "location": self.location,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "description": self.description,
        }


@dataclass
class ExperienceRecord:
    """A single work experience record.
    
    Used by ResumeBuilder to represent a parsed work experience entry.
    Created by parsing TextGroups labeled as "experience" section, extracting structured 
    information from entities and text patterns. Multiple records may exist for each job 
    or position listed on the resume.
    """
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_title": self.job_title,
            "company": self.company,
            "location": self.location,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "description": self.description,
        }


@dataclass
class CertificationRecord:
    """A single certification record.
    
    Used by ResumeBuilder to represent a parsed certification or credential.
    Created by parsing TextGroups labeled as "certifications" section, extracting 
    certification names. Multiple records may exist for each certification listed on the resume.
    """
    name: str
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
        }


@dataclass
class ActivityRecord:
    """A single activity/project record.
    
    Used by ResumeBuilder to represent extracurricular activities, projects, or other 
    miscellaneous achievements. Created by parsing TextGroups that don't fit into the 
    main categories (education, experience, skills, certifications). Captures a wide 
    variety of content like volunteer work, personal projects, awards, etc.
    """
    name: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
        }


@dataclass
class ExtractedResume:
    """Complete extracted resume data.
    
    The final output dataclass representing all structured information extracted from a resume.
    Created at the end of the processing pipeline by combining:
    - PersonInfo (from PersonExtractor)
    - Parsed records (from ResumeBuilder processing TextGroups)
    - Raw TextGroups (for debugging/additional processing)
    
    This is returned by the main pipeline and can be serialized to JSON for API responses
    or further processing by downstream systems.
    """
    person: PersonInfo
    education: List[EducationRecord] = field(default_factory=list)
    experience: List[ExperienceRecord] = field(default_factory=list)
    skills: List[str] = field(default_factory=list)
    certifications: List[CertificationRecord] = field(default_factory=list)
    activities: List[ActivityRecord] = field(default_factory=list)
    raw_groups: List[TextGroup] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "person": self.person.to_dict(),
            "education": [e.to_dict() for e in self.education],
            "experience": [e.to_dict() for e in self.experience],
            "skills": self.skills,
            "certifications": [c.to_dict() for c in self.certifications],
            "activities": [a.to_dict() for a in self.activities],
        }

