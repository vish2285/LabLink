from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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
    photo_url: Optional[str] = ""
    skills: List[str] = []
    recent_publications: List[PublicationOut] = []

class StudentProfileIn(BaseModel):
    name: Optional[str] = "Anonymous"
    email: Optional[str] = ""
    interests: str = Field(..., description="e.g. 'computer vision, robustness, NLP'")
    skills: Optional[str] = Field("", description="e.g. 'python, pytorch, cuda'")
    availability: Optional[str] = ""

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
