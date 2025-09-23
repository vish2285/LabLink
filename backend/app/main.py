# 🚀 ResearchMatch FastAPI (JSON-backed MVP)
from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import Professor as ProfessorModel
Base.metadata.create_all(bind=engine)
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os, json, re

# --- Optional TF-IDF (falls back to keyword overlap if unavailable) ---
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_OK = True
except Exception:
    SKLEARN_OK = False

app = FastAPI(title="ResearchMatch API", version="0.2.0")

# CORS for local dev (tighten in prod)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------ Data Load ------------------------
def _json_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(here, "professors.json")

def load_professors() -> List[Dict[str, Any]]:
    path = _json_path()
    if not os.path.exists(path):
        raise FileNotFoundError(f"professors.json not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for i, p in enumerate(data, start=1):
        if "id" not in p or p["id"] is None:
            p["id"] = i
        p.setdefault("name", "")
        p.setdefault("department", "")
        p.setdefault("email", "")
        p.setdefault("profile_link", "")
        p.setdefault("research_interests", "")
        p.setdefault("recent_publications", [])
    return data

# Load professors data at startup for reuse in API handlers
PROFESSORS: List[Dict[str, Any]] = load_professors()

# ------------------------ Models ------------------------
class Professor(BaseModel):
    id: int
    name: str
    department: Optional[str] = ""
    email: Optional[str] = ""
    research_interests: Optional[str] = ""
    recent_publications: Optional[List[Dict[str, Any]]] = []
    profile_link: Optional[str] = ""

class MatchItem(BaseModel):
    score: float                 # 0.0 - 1.0
    score_percent: float         # 0.0 - 100.0
    professor: Professor

class MatchResponse(BaseModel):
    student_query: str
    department: Optional[str] = ""
    matches: List[MatchItem]

class StudentProfileIn(BaseModel):
    name: Optional[str] = "Anonymous"
    email: Optional[str] = ""
    interests: str = Field(..., description="e.g. 'machine learning, vision, NLP'")
    skills: Optional[str] = Field("", description="e.g. 'python, pytorch, rust'")
    availability: Optional[str] = ""

class EmailRequest(BaseModel):
    student_name: str
    student_skills: Optional[str] = ""
    availability: Optional[str] = ""
    professor_name: str
    professor_email: Optional[str] = ""
    paper_title: Optional[str] = ""
    topic: Optional[str] = ""  # optional override for subject (e.g., 'computer vision')

class EmailDraft(BaseModel):
    subject: str
    body: str

# ------------------------ Matching Helpers ------------------------
_WS = re.compile(r"\s+")
def _mk_doc(p: Dict[str, Any]) -> str:
    pubs = p.get("recent_publications") or []
    pub_text = " ".join(f"{(d.get('title') or '')} {(d.get('abstract') or '')}" for d in pubs if isinstance(d, dict))
    return f"{p.get('research_interests','')} {pub_text}".strip()

def _norm(s: str) -> str:
    return _WS.sub(" ", (s or "").lower()).strip()

def _simple_keyword_score(query: str, doc: str) -> float:
    q = {t for t in re.split(r"[^a-z0-9]+", _norm(query)) if t}
    d = {t for t in re.split(r"[^a-z0-9]+", _norm(doc)) if t}
    if not q or not d:
        return 0.0
    return len(q & d) / len(q | d)

def _pct(x: float) -> float:
    return round(max(0.0, min(1.0, x)) * 100.0, 2)

def rank_professors(profs: List[Dict[str, Any]], query: str, top_k: int) -> List[Dict[str, Any]]:
    docs = [_mk_doc(p) for p in profs]
    if SKLEARN_OK:
        vect = TfidfVectorizer(stop_words="english").fit(docs + [query])
        dmat = vect.transform(docs)
        qvec = vect.transform([query])
        sims = cosine_similarity(qvec, dmat)[0]
        order = sims.argsort()[::-1][:top_k]
        return [{"score": float(sims[i]), "professor": profs[i]} for i in order]
    # fallback
    scored = [(_simple_keyword_score(query, d), i) for i, d in enumerate(docs)]
    scored.sort(key=lambda t: t[0], reverse=True)
    return [{"score": float(s), "professor": profs[i]} for s, i in scored[:top_k]]

# ------------------------ Routes ------------------------
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/view", response_model=List[Professor])
def view_raw():
    return PROFESSORS  # dev/debug

def _prof_to_dict(p: ProfessorModel) -> Dict[str, Any]:
    pubs: List[Dict[str, Any]] = []
    try:
        pubs = json.loads(p.recent_publications or "[]")
    except Exception:
        pubs = []
    return {
        "id": int(p.id),
        "name": p.name or "",
        "department": p.department or "",
        "email": p.email or "",
        "profile_link": p.profile_link or "",
        "research_interests": p.research_interests or "",
        "recent_publications": pubs,
    }


@app.get("/api/professors")
def list_professors(department: str | None = None, db: Session = Depends(get_db)):
    q = db.query(ProfessorModel)
    if department:
        q = q.filter(ProfessorModel.department.ilike(f"%{department}%"))
    return [_prof_to_dict(p) for p in q.all()]

@app.get("/api/professors/{professor_id}")
def get_professor(professor_id: int, db: Session = Depends(get_db)):
    p = db.get(ProfessorModel, professor_id)
    if not p:
        raise HTTPException(404, "Professor not found")
    return _prof_to_dict(p)

@app.get("/api/departments")
def list_departments(db: Session = Depends(get_db)):
    rows = db.query(ProfessorModel.department).distinct().all()
    return sorted([d for (d,) in rows if d]) 

@app.post("/api/match", response_model=MatchResponse)
def match_professors(
    profile: StudentProfileIn = Body(...),
    top_k: int = Query(10, ge=1, le=50),
    department: Optional[str] = Query(None, description="Optional substring filter"),
    db: Session = Depends(get_db),
):
    try:
        if not profile.interests.strip() and not (profile.skills or "").strip():
            raise HTTPException(400, "Provide at least interests or skills")

        query = f"{profile.interests} {profile.skills or ''}".strip()
        db_profs = db.query(ProfessorModel)
        if department:
            db_profs = db_profs.filter(ProfessorModel.department.ilike(f"%{department}%"))
        profs = [_prof_to_dict(p) for p in db_profs.all()]

        if not profs:
            return MatchResponse(student_query=query, department=department or "", matches=[])

        ranked = rank_professors(profs, query, top_k)
        matches = [
            MatchItem(
                score=round(r["score"], 6),
                score_percent=_pct(r["score"]),
                professor=Professor(**r["professor"])
            )
            for r in ranked
        ]
        return MatchResponse(student_query=query, department=department or "", matches=matches)
    except HTTPException:
        raise
    except Exception as e:
        # Never crash the server; return empty matches with the query context
        return MatchResponse(student_query=f"{(profile.interests or '').strip()} {(profile.skills or '').strip()}".strip(), department=department or "", matches=[])

@app.post("/api/email/generate", response_model=EmailDraft)
def email_generate(req: EmailRequest):
    # dynamic subject preference: paper_title > topic > inferred from skills
    def infer_topic():
        if req.paper_title:
            return req.paper_title
        if req.topic:
            return req.topic
        # crude extract from skills: take first phrase/word
        s = (req.student_skills or "").strip().split(",")[0].strip()
        return s or "your research"

    last = (req.professor_name or "Professor").split()[-1]
    topic = infer_topic()
    subject = f"Interest in your work on {topic}"

    paper_line = f' I recently read your paper "{req.paper_title}".' if req.paper_title else ""
    skills = req.student_skills or "relevant skills"
    avail = req.availability or "this quarter"

    body = (
        f"Dear Dr. {last},\n\n"
        f"My name is {req.student_name}, and I’m a student at UC Davis interested in your work on {topic}.{paper_line} "
        f"I’d love to contribute and apply my experience in {skills}. "
        f"I’m available {avail} and would appreciate the opportunity to discuss how I can help.\n\n"
        f"Best regards,\n{req.student_name}"
    )
    return EmailDraft(subject=subject, body=body)
