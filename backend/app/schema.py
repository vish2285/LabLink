from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import re

class PublicationOut(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    year: Optional[int] = None
    link: Optional[str] = None

class ProfessorOut(BaseModel):
    id: int
    name: str
    department: Optional[str] = ""
    email: Optional[str] = ""
    research_interests: Optional[str] = ""
    profile_link: Optional[str] = ""
    personal_site: Optional[str] = ""
    photo_url: Optional[str] = ""
    skills: List[str] = []
    recent_publications: List[PublicationOut] = []

class StudentProfileIn(BaseModel):
    name: Optional[str] = "Anonymous"
    email: Optional[str] = ""
    interests: str = Field(..., description="e.g. 'computer vision, robustness, NLP'")
    skills: Optional[str] = Field("", description="e.g. 'python, pytorch, cuda'")
    availability: Optional[str] = ""
    
    @field_validator('interests')
    @classmethod
    def validate_interests(cls, v):
        if not v or not v.strip():
            raise ValueError('Interests cannot be empty')
        if len(v) > 2000:
            raise ValueError('Interests too long (max 2000 characters)')
        # Basic XSS protection
        if re.search(r'<script|javascript:|on\w+\s*=', v, re.IGNORECASE):
            raise ValueError('Invalid characters in interests')
        return v.strip()
    
    @field_validator('skills')
    @classmethod
    def validate_skills(cls, v):
        if v and len(v) > 1000:
            raise ValueError('Skills too long (max 1000 characters)')
        if v and re.search(r'<script|javascript:|on\w+\s*=', v, re.IGNORECASE):
            raise ValueError('Invalid characters in skills')
        return v.strip() if v else ""
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v

class MatchItem(BaseModel):
    score: float
    score_percent: float
    why: Dict[str, List[str]]
    professor: ProfessorOut

class MatchResponse(BaseModel):
    student_query: str
    department: Optional[str] = ""
    weights: Dict[str, float]
    matches: List[MatchItem]

class EmailRequest(BaseModel):
    student_name: str
    student_skills: Optional[str] = ""
    availability: Optional[str] = ""
    professor_name: str
    professor_email: Optional[str] = ""
    paper_title: Optional[str] = ""
    topic: Optional[str] = ""

class EmailDraft(BaseModel):
    subject: str
    body: str
