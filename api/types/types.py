"""
Pydantic models for API responses.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


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