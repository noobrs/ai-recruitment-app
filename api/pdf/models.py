"""
Data models for PDF resume extraction pipeline.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class BoundingBox:
    """Bounding box coordinates for redaction."""
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
    """A segment of text with its position and metadata."""
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
    """An extracted entity with position and confidence."""
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
class TextGroup:
    """A group of text organized by section label (classified heading)."""
    heading: str  # Section label (e.g., "education", "experience") from GLiNER classification
    text: str  # Combined text content
    segments: List[TextSegment] = field(default_factory=list)
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
    """A region to be redacted in the PDF."""
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
    """Extracted person information for redaction."""
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
    """A single education record."""
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
    """A single work experience record."""
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
    """A single certification record."""
    name: str
    organization: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "organization": self.organization,
            "date": self.date,
            "description": self.description,
        }


@dataclass
class ActivityRecord:
    """A single activity/project record."""
    name: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
        }


@dataclass
class ExtractedResume:
    """Complete extracted resume data."""
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

