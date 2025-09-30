# 🚀 ResearchMatch FastAPI (JSON-backed, skills-aware matching)
from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import re

from .database import Base, engine, get_db
from . import crud
from .schema import (
    ProfessorOut, PublicationOut, StudentProfileIn,
    MatchResponse, MatchItem, EmailRequest, EmailDraft
)
from .matching import (
    prof_to_doc, VectorStore, extract_skills, jaccard, pubs_score, tokenize, norm_text
)
from .email_utils import build_email
import httpx
import re
from urllib.parse import urljoin

# ---- App & CORS ----
app = FastAPI(title="ResearchMatch DB API", version="1.0.0")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DB init (no Alembic for MVP) ----
Base.metadata.create_all(bind=engine)

# ---- Vector store (rebuilt on reload) ----
VECSTORE: VectorStore | None = None
DOCS: list[str] = []
PROF_IDS: list[int] = []

def rebuild_vectorstore(db: Session):
    global VECSTORE, DOCS, PROF_IDS
    profs = crud.list_professors(db)
    PROF_IDS = [p.id for p in profs]
    # flatten professor record to dict expected by prof_to_doc
    payloads = []
    for p in profs:
        skills = [ps.skill.name for ps in p.professor_skills]
        pubs = [{"title": d.title, "abstract": d.abstract, "year": d.year, "link": d.link} for d in p.publications]
        payloads.append({
            "research_interests": p.research_interests or "",
            "recent_publications": pubs,
            "skills": skills
        })
    DOCS = [prof_to_doc(x) for x in payloads]
    VECSTORE = VectorStore(DOCS)

@app.on_event("startup")
def startup():
    with next(get_db()) as db:  # type: ignore
        rebuild_vectorstore(db)

# ---- Helpers ----
def clamp01(x: float) -> float: return max(0.0, min(1.0, x))
def pct(x: float) -> float: return round(clamp01(x) * 100.0, 2)

def to_prof_out(p) -> ProfessorOut:
    skills = [ps.skill.name for ps in p.professor_skills]
    pubs = [PublicationOut(title=d.title, abstract=d.abstract, year=d.year, link=d.link) for d in p.publications]
    return ProfessorOut(
        id=p.id, name=p.name, department=p.department, email=p.email,
        research_interests=p.research_interests, profile_link=p.profile_link,
        photo_url=getattr(p, 'photo_url', ''),
        skills=skills, recent_publications=pubs
    )

# ---- Routes ----
@app.get("/health")
def health(): return {"ok": True}

@app.get("/api/professors", response_model=list[ProfessorOut])
def list_professors(department: str | None = Query(None), db: Session = Depends(get_db)):
    profs = crud.list_professors(db, department)
    return [to_prof_out(p) for p in profs]

@app.get("/api/professors/{professor_id}", response_model=ProfessorOut)
def get_professor(professor_id: int, db: Session = Depends(get_db)):
    p = crud.get_professor(db, professor_id)
    if not p: raise HTTPException(404, "Professor not found")
    return to_prof_out(p)

@app.get("/api/departments", response_model=list[str])
def list_departments(db: Session = Depends(get_db)):
    return crud.list_departments(db)

@app.get("/api/reload_docs")
def reload_docs(db: Session = Depends(get_db)):
    rebuild_vectorstore(db)
    return {"ok": True, "count": len(PROF_IDS)}

@app.post("/api/match", response_model=MatchResponse)
def match_professors(
    profile: StudentProfileIn = Body(...),
    top_k: int = Query(10, ge=1, le=50),
    department: str | None = Query(None),
    w_interests: float = Query(0.55, ge=0.0, le=1.0),
    w_skills: float = Query(0.35, ge=0.0, le=1.0),
    w_pubs: float = Query(0.10, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    if not profile.interests.strip() and not (profile.skills or "").strip():
        raise HTTPException(400, "Provide at least interests or skills")

    # normalize weights and add small boost when multiple channels align
    total = max(1e-9, w_interests + w_skills + w_pubs)
    w_interests, w_skills, w_pubs = w_interests/total, w_skills/total, w_pubs/total

    # department filter first
    profs = crud.list_professors(db, department)
    if not profs:
        return MatchResponse(student_query="", department=department or "", weights={
            "interests": w_interests, "skills": w_skills, "pubs": w_pubs
        }, matches=[])

    # prepare vector similarities once
    query_text = f"{profile.interests} {profile.skills or ''}".strip()
    sims = VECSTORE.sims(query_text) if VECSTORE else [0.0] * len(PROF_IDS)

    # map professor id -> sim (since VECSTORE order is all profs, not filtered)
    id_to_sim = {pid: sims[i] for i, pid in enumerate(PROF_IDS)}

    # student skills and interests
    student_skills = extract_skills(profile.skills or "")
    interest_tokens = [t for t in tokenize(profile.interests) if len(t) > 2][:12]
    # Preserve multi-word interest phrases split by comma/semicolon for why-details
    interest_phrases_raw = [s.strip() for s in re.split(r"[,;]", profile.interests) if s.strip()]
    interest_phrases_norm = [norm_text(s) for s in interest_phrases_raw]

    scored = []
    for p in profs:
        sim_interests = clamp01(id_to_sim.get(p.id, 0.0))

        prof_skills = [ps.skill.name for ps in p.professor_skills]
        jac, skill_hits = jaccard(student_skills, prof_skills)
        # Skill precision/recall/F1 to penalize missing required skills
        A, B = set(student_skills), set(prof_skills)
        inter = len(A & B)
        prec = inter / len(B) if B else 0.0
        rec = inter / len(A) if A else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        skill_score = (0.7 * f1) + (0.3 * jac)

        pubs_list = [{"title": d.title, "abstract": d.abstract, "year": d.year, "link": d.link} for d in p.publications]
        pub_base, pub_hits, bonus = pubs_score(interest_tokens, pubs_list)

        # Collect phrase hits for interests (use multi-word phrases where applicable)
        text_parts = [p.research_interests or ""]
        for d in pubs_list:
            text_parts += [(d.get("title") or ""), (d.get("abstract") or "")]
        combined_text = norm_text(" ".join(text_parts))
        phrase_hits: list[str] = []
        for raw, nn in zip(interest_phrases_raw, interest_phrases_norm):
            if nn and nn in combined_text:
                phrase_hits.append(raw)

        base = (w_interests * sim_interests) + (w_skills * skill_score) + (w_pubs * pub_base)
        # synergy bonus when both interests and skills are strong
        synergy = 1.0
        if sim_interests >= 0.5 and skill_score >= 0.5:
            synergy = 1.08
        # penalize weak skill coverage
        if f1 < 0.3:
            synergy *= 0.85
        final = clamp01(base * bonus * synergy)

        why = {
            "interests_hits": phrase_hits[:6],
            "skills_hits": skill_hits[:6],
            "pubs_hits": pub_hits[:6]
        }
        scored.append((final, len(skill_hits), -p.id, p, why))

    scored.sort(reverse=True, key=lambda x: (x[0], x[1], x[2]))

    matches = []
    for final, _, __, p, why in scored[:top_k]:
        matches.append(MatchItem(
            score=round(final, 6),
            score_percent=pct(final),
            why=why,
            professor=to_prof_out(p)
        ))

    return MatchResponse(
        student_query=query_text,
        department=department or "",
        weights={"interests": w_interests, "skills": w_skills, "pubs": w_pubs},
        matches=matches
    )

@app.post("/api/email/generate", response_model=EmailDraft)
def email_generate(req: EmailRequest):
    draft = build_email(
        student_name=req.student_name,
        student_skills=req.student_skills,
        availability=req.availability,
        professor_name=req.professor_name,
        paper_title=req.paper_title,
        topic=req.topic
    )
    return EmailDraft(**draft)


# ---- Photo scraping (best-effort, lightweight) ----
@app.get("/api/scrape_photo")
def scrape_photo(url: str):
    try:
        resp = httpx.get(url, timeout=6.0)
        resp.raise_for_status()
        html = resp.text

        def find_meta(pattern: str) -> str | None:
            m = re.search(pattern, html, re.IGNORECASE)
            return m.group(1).strip() if m else None

        # Try OpenGraph
        og = find_meta(r"<meta[^>]+property=[\'\"]og:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]")
        if og:
            return {"photo_url": urljoin(url, og)}

        # Try twitter:image
        tw = find_meta(r"<meta[^>]+name=[\'\"]twitter:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]")
        if tw:
            return {"photo_url": urljoin(url, tw)}

        # Fallback to first <img>
        img = find_meta(r"<img[^>]+src=[\'\"]([^\'\"]+)[\'\"][^>]*>")
        if img:
            return {"photo_url": urljoin(url, img)}

        return {"photo_url": ""}
    except Exception:
        return {"photo_url": ""}
