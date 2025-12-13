"""
Pydantic models for API responses.
"""

from typing import Dict, Tuple, List, Optional
from pydantic import BaseModel
from dataclasses import field

class TextSpan(BaseModel):
    text: str
    label: str
    heading: Optional[str] = None
    bbox: Optional[Tuple[float, float, float, float]] = None

class TextGroup(BaseModel):
    heading: str
    text: str
    spans: List[TextSpan] = field(default_factory=list)


class CandidateOut(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    location: Optional[str]


class EducationOut(BaseModel):
    degree: Optional[str]
    institution: Optional[str]
    location: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    description: Optional[str]


class ExperienceOut(BaseModel):
    job_title: Optional[str]
    company: Optional[str]
    location: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    description: Optional[str]


class CertificationOut(BaseModel):
    name: Optional[str]
    description: Optional[str]


class ActivityOut(BaseModel):
    name: Optional[str]
    description: Optional[str]


class ResumeData(BaseModel):
    candidate: CandidateOut
    education: List[EducationOut]
    experience: List[ExperienceOut]
    skills: List[str]
    certifications: List[CertificationOut]
    activities: List[ActivityOut]


class ApiResponse(BaseModel):
    status: str
    data: Optional[ResumeData] = None
    message: Optional[str] = None
    redacted_file_url: Optional[str] = None