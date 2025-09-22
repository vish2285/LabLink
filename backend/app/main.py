# 🚀 ResearchMatch FastAPI (JSON-backed MVP)
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/api/professors", response_model=List[Professor])
def list_professors(department: Optional[str] = Query(None, description="Substring filter (e.g., 'Computer Science')")):
    if not department:
        return PROFESSORS
    dep = department.lower()
    return [p for p in PROFESSORS if dep in (p.get("department") or "").lower()]

@app.get("/api/professors/{professor_id}", response_model=Professor)
def get_professor(professor_id: int):
    for p in PROFESSORS:
        if int(p["id"]) == professor_id:
            return p
    raise HTTPException(404, "Professor not found")

@app.get("/api/departments", response_model=List[str])
def list_departments():
    deps = sorted({(p.get("department") or "").strip() for p in PROFESSORS if p.get("department")})
    return [d for d in deps if d]

@app.post("/api/match", response_model=MatchResponse)
def match_professors(
    profile: StudentProfileIn = Body(...),
    top_k: int = Query(10, ge=1, le=50),
    department: Optional[str] = Query(None, description="Optional substring filter"),
):
    if not profile.interests.strip() and not (profile.skills or "").strip():
        raise HTTPException(400, "Provide at least interests or skills")

    query = f"{profile.interests} {profile.skills or ''}".strip()
    profs = PROFESSORS
    if department:
        dep = department.lower()
        profs = [p for p in PROFESSORS if dep in (p.get("department") or "").lower()]

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
