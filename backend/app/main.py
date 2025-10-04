# LabLink FastAPI (JSON-backed, skills-aware matching)
from fastapi import FastAPI, Depends, HTTPException, Query, Body, Request, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
import os
import csv
import re
import json
import time
import logging
from functools import wraps
from datetime import datetime

from .database import Base, engine, get_db
from dotenv import load_dotenv
from . import crud
from . import models
from .seed_json import seed_from_json  # reuse JSON seeder when available
from .schema import (
    ProfessorOut, PublicationOut, StudentProfileIn,
    MatchResponse, MatchItem, EmailRequest, EmailDraft
)
from .matching import (
    prof_to_doc, VectorStore, extract_skills, jaccard, pubs_score, tokenize, norm_text,
    expand_query_text, SemanticIndex
)
from .matching import CrossEncoderReranker
from .email_utils import build_email, send_email_with_attachment
import httpx
import base64
from urllib.parse import urljoin
from datetime import datetime, timedelta
from typing import Optional

# Load environment from .env (for SMTP, etc.)
load_dotenv()

# ---- Logging Setup ----
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ---- Rate Limiting ----
app = FastAPI(title="LabLink DB API", version="1.0.0")

# ---- Performance Monitoring ----
def monitor_performance(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        logger.info(f"🚀 Starting {func.__name__}")
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"✅ {func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ {func.__name__} failed after {duration:.2f}s: {str(e)}")
            raise
    return wrapper
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
ALLOWED_EMAIL_DOMAINS = [
    d.strip().lower() for d in os.getenv("ALLOWED_EMAIL_DOMAINS", "ucdavis.edu").split(",") if d.strip()
]
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "X-Requested-With",
        "Authorization",
        "Accept",
        "Accept-Language",
        "Cache-Control",
        "Pragma",
    ],
)
"""
Google Identity Services auth: verify Google ID token (Authorization: Bearer <id_token>)
and enforce @ucdavis.edu domain.
"""

security = HTTPBearer(auto_error=False)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ---- Session cookie config ----
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "lablink_session")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "1800"))
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN") or None
COOKIE_SECURE = str(os.getenv("COOKIE_SECURE", "1")).lower() in {"1", "true", "yes"}
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()

# in-memory rate limit buckets
_EMAIL_SEND_EVENTS: dict[str, list[int]] = {}

def verify_google_token(token: str) -> dict:
    try:
        from google.oauth2 import id_token as google_id_token  # type: ignore
        from google.auth.transport import requests as google_requests  # type: ignore
        req = google_requests.Request()
        claims = google_id_token.verify_oauth2_token(token, req, GOOGLE_CLIENT_ID)
        # claims must have email_verified True ideally
        if not claims.get("email"):
            raise HTTPException(401, "Token missing email")
        iss = str(claims.get("iss", ""))
        if iss not in {"accounts.google.com", "https://accounts.google.com"}:
            raise HTTPException(401, "Invalid token issuer")
        if claims.get("email_verified") is not True:
            raise HTTPException(401, "Unverified email")
        return claims
    except Exception as e:
        # Surface precise verification reason during debugging
        raise HTTPException(401, f"Invalid Google token: {e}")

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    session_token: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    # Prefer cookie-based session
    if session_token:
        sess = crud.get_session(db, session_token)
        if not sess:
            raise HTTPException(401, "Invalid or expired session")
        user = db.query(models.User).filter(models.User.id == sess.user_id).first()
        if not user:
            raise HTTPException(401, "User not found")
        return {"sub": f"session:{user.id}", "email": user.email, "name": user.name, "picture": user.picture}

    # Fallback legacy Bearer Google ID token
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Missing authentication")
    token = credentials.credentials
    return verify_google_token(token)

def require_ucdavis_user(user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    email = str(user.get("email") or "")
    domain = email.split("@", 1)[-1].lower() if "@" in email else None
    hd = str(user.get("hd") or "").lower() or None
    allowed = set(ALLOWED_EMAIL_DOMAINS)
    if (domain not in allowed) and (hd not in allowed):
        raise HTTPException(403, f"Email domain not allowed. Allowed: {', '.join(sorted(allowed))}")
    # Upsert user record by Google sub
    try:
        sub = str(user.get("sub"))
        name = user.get("name")
        picture = user.get("picture")
        if sub:
            crud.get_or_create_user_by_sub(db, sub, email=email, name=name, picture=picture)
    except Exception:
        pass
    return user


 # Removed legacy /api/auth/google since we verify tokens per request


# ---- DB init (no Alembic for MVP) ----
Base.metadata.create_all(bind=engine)

# ---- Vector stores (rebuilt on reload) ----
VECSTORE: VectorStore | None = None
SEM_INDEX: SemanticIndex | None = None
RERANKER: CrossEncoderReranker | None = None
DOCS: list[str] = []
PROF_IDS: list[int] = []
# Map professor id -> personal_site loaded from JSON (since not stored in DB)
PERSONAL_SITE_MAP: dict[int, str] = {}

def extract_publications(p) -> list[dict]:
    """Return publications as list of dicts from ORM relation or JSON fallback."""
    try:
        if getattr(p, "publications", None):
            return [
                {
                    "title": d.title,
                    "abstract": d.abstract,
                    "year": d.year,
                    "link": d.link,
                }
                for d in p.publications
            ]
        # Fallback to JSON stored in Professor.recent_publications
        data = json.loads(getattr(p, "recent_publications", "[]") or "[]")
        pubs: list[dict] = []
        for d in data or []:
            if isinstance(d, dict):
                pubs.append({
                    "title": d.get("title"),
                    "abstract": d.get("abstract"),
                    "year": d.get("year"),
                    "link": d.get("link"),
                })
        return pubs
    except Exception:
        return []

def rebuild_vectorstore(db: Session):
    global VECSTORE, SEM_INDEX, DOCS, PROF_IDS
    profs = crud.list_professors(db)
    PROF_IDS = [p.id for p in profs]
    # flatten professor record to dict expected by prof_to_doc
    payloads = []
    for p in profs:
        skills = [ps.skill.name for ps in p.professor_skills]
        pubs = extract_publications(p)
        payloads.append({
            "research_interests": p.research_interests or "",
            "recent_publications": pubs,
            "skills": skills
        })
    DOCS = [prof_to_doc(x) for x in payloads]
    VECSTORE = VectorStore(DOCS)
    SEM_INDEX = SemanticIndex(DOCS)
    global RERANKER
    try:
        RERANKER = CrossEncoderReranker()
    except Exception:
        RERANKER = None

def load_personal_sites_from_json():
    global PERSONAL_SITE_MAP
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        json_candidates = [
            os.path.join(here, "data", "professors.json"),
            os.path.join(here, "professors.json"),
        ]
        for jp in json_candidates:
            if os.path.isfile(jp):
                with open(jp, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    m: dict[int, str] = {}
                    for obj in data:
                        try:
                            pid = int(obj.get("id")) if obj.get("id") is not None else None
                            site = (obj.get("personal_site") or "").strip()
                            if pid and site:
                                m[pid] = site
                        except Exception:
                            continue
                    PERSONAL_SITE_MAP = m
                break
    except Exception:
        PERSONAL_SITE_MAP = {}

@app.on_event("startup")
def startup():
    with next(get_db()) as db:  # type: ignore
        # Auto-seed DB if empty from JSON (preferred) or CSV fallback
        try:
            has_prof = db.query(models.Professor).first() is not None
            if not has_prof:
                here = os.path.dirname(os.path.abspath(__file__))
                json_candidates = [
                    os.path.join(here, "data", "professors.json"),
                    os.path.join(here, "professors.json"),
                ]
                seeded = False
                for jp in json_candidates:
                    if os.path.isfile(jp):
                        seed_from_json(jp)
                        seeded = True
                        break
                if not seeded:
                    csv_path = os.path.join(here, "professors.csv")
                    if os.path.isfile(csv_path) and os.path.getsize(csv_path) > 0:
                        try:
                            # Minimal CSV seeding
                            with open(csv_path, newline="", encoding="utf-8") as f:
                                reader = csv.DictReader(f)
                                for i, row in enumerate(reader, start=1):
                                    name = (row.get("name") or "").strip()
                                    if not name:
                                        continue
                                    dept = (row.get("dept") or row.get("department") or "").strip()
                                    email = (row.get("email") or "").strip()
                                    interests = (row.get("interests") or "").strip()
                                    pubs_raw = (row.get("publications") or "").strip()
                                    pubs = []
                                    if pubs_raw:
                                        # Split on semicolon or pipe
                                        parts = re.split(r"[;|]", pubs_raw)
                                        for p in parts:
                                            t = (p or "").strip()
                                            if t:
                                                pubs.append({"title": t})
                                    db.add(models.Professor(
                                        name=name,
                                        department=dept or None,
                                        email=email or None,
                                        research_interests=interests or None,
                                        profile_link=None,
                                        photo_url="",
                                        recent_publications=json.dumps(pubs),
                                    ))
                                db.commit()
                        except Exception:
                            db.rollback()
            # After potential seeding, rebuild vector store
            rebuild_vectorstore(db)
        except Exception:
            # Ensure we don't block startup on seeding issues
            rebuild_vectorstore(db)
        # Load personal_site map from JSON for API responses
        load_personal_sites_from_json()

# ---- Helpers ----
def clamp01(x: float) -> float: return max(0.0, min(1.0, x))
def pct(x: float) -> float: return round(clamp01(x) * 100.0, 2)

def to_prof_out(p) -> ProfessorOut:
    skills = [ps.skill.name for ps in p.professor_skills]
    pub_dicts = extract_publications(p)
    pubs = [PublicationOut(**d) for d in pub_dicts]
    # Prefer explicit personal_site; fall back only to JSON map (do not use profile_link)
    _personal_site = (
        getattr(p, 'personal_site', '') or
        PERSONAL_SITE_MAP.get(p.id, '')
    )
    return ProfessorOut(
        id=p.id, name=p.name, department=p.department, email=p.email,
        research_interests=p.research_interests, profile_link=p.profile_link,
        personal_site=_personal_site,
        photo_url=getattr(p, 'photo_url', ''),
        skills=skills, recent_publications=pubs
    )

# ---- Routes ----
@app.get("/health")
def health(): return {"ok": True}

# Alias for frontend proxy that rewrites /api/* to the backend
@app.get("/api/health")
def api_health(): return {"ok": True}

# ---- Security headers ----
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    resp = await call_next(request)
    try:
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        resp.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        # Disallow embedding API responses in iframes to mitigate clickjacking
        resp.headers.setdefault("X-Frame-Options", "DENY")
        # Conservative CSP for API responses
        resp.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        )
        if str(os.getenv("HSTS_ENABLED", "1")).lower() in {"1", "true", "yes"}:
            resp.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    except Exception:
        pass
    return resp

# ---- Cookie-based auth endpoints ----
@app.post("/api/auth/login")
def auth_login(id_token: str = Body(..., embed=True), response: Response = None, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Server misconfigured")
    claims = verify_google_token(id_token)
    email = str(claims.get("email") or "")
    sub = str(claims.get("sub") or "")
    name = claims.get("name")
    picture = claims.get("picture")
    if not (email and sub):
        raise HTTPException(401, "Invalid token claims")
    domain = email.split("@", 1)[-1].lower() if "@" in email else None
    hd = str(claims.get("hd") or "").lower() or None
    allowed = set(ALLOWED_EMAIL_DOMAINS)
    if (domain not in allowed) and (hd not in allowed):
        raise HTTPException(403, "Email domain not allowed")
    user = crud.get_or_create_user_by_sub(db, sub, email=email, name=name, picture=picture)
    sess = crud.create_session(db, user, ttl_seconds=SESSION_TTL_SECONDS)
    if response is None:
        response = Response()
    expires = datetime.utcnow() + timedelta(seconds=SESSION_TTL_SECONDS)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=sess.token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none" if COOKIE_SAMESITE == "none" else ("strict" if COOKIE_SAMESITE == "strict" else "lax"),
        domain=COOKIE_DOMAIN,
        expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        path="/",
    )
    return {"ok": True, "user": {"email": user.email, "name": user.name, "picture": user.picture}}

@app.post("/api/auth/logout")
def auth_logout(response: Response, db: Session = Depends(get_db), session_token: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME)):
    if session_token:
        try:
            crud.delete_session(db, session_token)
        except Exception:
            pass
    response.delete_cookie(key=SESSION_COOKIE_NAME, domain=COOKIE_DOMAIN, path="/")
    return {"ok": True}

@app.get("/api/auth/me")
def auth_me(user: dict = Depends(get_current_user)):
    # Accept either cookie session or Bearer token (handled in get_current_user)
    return {"email": user.get("email"), "name": user.get("name"), "picture": user.get("picture")}

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
    # Always expose only Computer Science as the selectable department
    return ["Computer Science"]

@app.get("/api/reload_docs")
def reload_docs(db: Session = Depends(get_db)):
    rebuild_vectorstore(db)
    return {"ok": True, "count": len(PROF_IDS)}

@app.post("/api/match", response_model=MatchResponse)
def match_professors(
    request: Request,
    profile: StudentProfileIn = Body(...),
    top_k: int | None = Query(None, ge=1, le=50),
    department: str | None = Query(None),
    w_interests: float = Query(0.55, ge=0.0, le=1.0),
    w_skills: float = Query(0.35, ge=0.0, le=1.0),
    w_pubs: float = Query(0.10, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    user: dict = Depends(require_ucdavis_user),
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
    # Expand query for lexical recall
    expanded_q = expand_query_text(profile.interests, profile.skills)
    sims_lex = VECSTORE.sims(expanded_q) if VECSTORE else [0.0] * len(PROF_IDS)
    # Semantic similarities (graceful fallback to zeros if unavailable)
    sims_sem = (SEM_INDEX.sims(query_text) if SEM_INDEX else [0.0] * len(PROF_IDS))

    # map professor id -> sim (since VECSTORE order is all profs, not filtered)
    id_to_lex = {pid: sims_lex[i] for i, pid in enumerate(PROF_IDS)}
    id_to_sem = {pid: sims_sem[i] for i, pid in enumerate(PROF_IDS)}

    # student skills and interests
    student_skills = extract_skills(profile.skills or "")
    interest_tokens = [t for t in tokenize(profile.interests) if len(t) > 2][:12]
    # Preserve multi-word interest phrases split by comma/semicolon for why-details
    interest_phrases_raw = [s.strip() for s in re.split(r"[,;]", profile.interests) if s.strip()]
    interest_phrases_norm = [norm_text(s) for s in interest_phrases_raw]

    scored = []
    for p in profs:
        # Blend lexical and semantic interests when semantic is available
        lex = id_to_lex.get(p.id, 0.0)
        sem = id_to_sem.get(p.id, 0.0)
        if sem > 0.0:
            # Favor semantic more heavily for maximum paraphrase robustness
            sim_interests = clamp01(0.40 * lex + 0.60 * sem)
        else:
            sim_interests = clamp01(lex)

        prof_skills = [ps.skill.name for ps in p.professor_skills]
        jac, skill_hits = jaccard(student_skills, prof_skills)
        # Skill precision/recall/F1 to penalize missing required skills
        A, B = set(student_skills), set(prof_skills)
        inter = len(A & B)
        prec = inter / len(B) if B else 0.0
        rec = inter / len(A) if A else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        skill_score = (0.7 * f1) + (0.3 * jac)

        pubs_list = extract_publications(p)
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

    # Preliminary selection before optional reranking
    prelim = scored[: (top_k or 100)] if scored else []

    # Optional cross-encoder rerank of prelim set using concatenated doc text
    if RERANKER is not None and getattr(RERANKER, 'available', False) and prelim:
        doc_texts = []
        for _, __, ___, p, ____ in prelim:
            # Build a more descriptive doc for reranking
            parts = [p.research_interests or ""]
            pubs_list = extract_publications(p)
            for d in pubs_list:
                parts += [(d.get("title") or ""), (d.get("abstract") or "")]
            doc_texts.append(norm_text(" ".join(parts)))
        ce_scores = RERANKER.score(query_text, doc_texts)
        # Blend CE score with existing final to produce rerank
        blended = []
        for (final, hits, neg_id, p, why), ce in zip(prelim, ce_scores):
            rerank = clamp01(0.5 * final + 0.5 * ce)
            blended.append((rerank, hits, neg_id, p, why))
        blended.sort(reverse=True, key=lambda x: (x[0], x[1], x[2]))
        prelim = blended

    # Final selection honoring top_k if provided
    if top_k is not None:
        selected = prelim[:top_k]
    else:
        selected = [t for t in prelim if t[0] > 0.0]

    matches = []
    for final, _, __, p, why in selected:
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
def email_generate(req: EmailRequest, user: dict = Depends(require_ucdavis_user)):
    draft = build_email(
        student_name=req.student_name,
        student_skills=req.student_skills,
        availability=req.availability,
        professor_name=req.professor_name,
        paper_title=req.paper_title,
        topic=req.topic
    )
    return EmailDraft(**draft)

@app.post("/api/email/send")
def email_send(
    to: str = Body(..., embed=True),
    subject: str = Body(..., embed=True),
    body: str = Body(..., embed=True),
    filename: str | None = Body(None, embed=True),
    file_b64: str | None = Body(None, embed=True),
    user: dict = Depends(require_ucdavis_user),
):
    # Validate basic fields
    if not to or not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", to):
        raise HTTPException(422, "Invalid recipient email")
    if not subject or len(subject) > 200:
        raise HTTPException(422, "Invalid subject")
    if not body or len(body) > 20000:
        raise HTTPException(422, "Invalid body content")

    # Attachment limit 5MB
    attachment_bytes = None
    if file_b64:
        approx_size = int(len(file_b64) * 0.75)
        if approx_size > 5 * 1024 * 1024:
            raise HTTPException(413, "Attachment too large (max 5MB)")
        try:
            attachment_bytes = base64.b64decode(file_b64)
        except Exception:
            raise HTTPException(422, "Invalid attachment encoding")

    # Simple in-memory rate limit per user (10 emails / 10 minutes)
    key = str(user.get("email") or user.get("sub") or "anon")
    now = int(datetime.utcnow().timestamp())
    window = 600
    bucket = _EMAIL_SEND_EVENTS.get(key, [])
    bucket = [t for t in bucket if (now - t) <= window]
    if len(bucket) >= 10:
        raise HTTPException(429, "Rate limit exceeded. Try later.")
    bucket.append(now)
    _EMAIL_SEND_EVENTS[key] = bucket

    send_email_with_attachment(
        to_email=to,
        subject=subject,
        body=body,
        reply_to=str(user.get("email") or ""),
        attachment_bytes=attachment_bytes,
        attachment_filename=filename,
    )
    return {"ok": True}


# ---- Photo scraping (best-effort, lightweight) ----
@app.get("/api/scrape_photo")
def scrape_photo(url: str, user: dict = Depends(require_ucdavis_user)):
    try:
        # Allow only http(s) and restrict to a safe allowlist of domains
        if not isinstance(url, str) or not re.match(r"^https?://", url, re.IGNORECASE):
            return {"photo_url": ""}
        allowed_hosts = {"ucdavis.edu", "cs.ucdavis.edu", "ucdavis.github.io"}
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if not host or not any(host == d or host.endswith("." + d) for d in allowed_hosts):
            return {"photo_url": ""}

        # lightweight rate limit per user/email for this endpoint (5/min)
        key = f"scrape:{str(user.get('email') or user.get('sub') or 'anon')}"
        now = int(datetime.utcnow().timestamp())
        window = 60
        bucket = _EMAIL_SEND_EVENTS.get(key, [])
        bucket = [t for t in bucket if (now - t) <= window]
        if len(bucket) >= 5:
            raise HTTPException(429, "Rate limit exceeded. Try later.")
        bucket.append(now)
        _EMAIL_SEND_EVENTS[key] = bucket

        resp = httpx.get(url, timeout=8.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        })
        resp.raise_for_status()
        html = resp.text

        def find(pattern: str) -> str | None:
            m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else None

        # OpenGraph variants
        for pat in [
            r"<meta[^>]+property=[\'\"]og:image:url[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
            r"<meta[^>]+property=[\'\"]og:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
            r"<meta[^>]+name=[\'\"]og:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
        ]:
            val = find(pat)
            if val:
                return {"photo_url": urljoin(url, val)}

        # Twitter card
        tw = find(r"<meta[^>]+name=[\'\"]twitter:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]")
        if tw:
            return {"photo_url": urljoin(url, tw)}

        # <link rel="image_src">
        link_img = find(r"<link[^>]+rel=[\'\"]image_src[\'\"][^>]+href=[\'\"]([^\'\"]+)[\'\"]")
        if link_img:
            return {"photo_url": urljoin(url, link_img)}

        # UC Davis directory profile images
        uc_img = find(r"<img[^>]+src=[\'\"]([^\'\"]*/styles/sf_profile/public/[^\'\"]+)[\'\"][^>]*>")
        if uc_img:
            return {"photo_url": urljoin(url, uc_img)}

        # srcset attribute
        srcset = find(r"<img[^>]+srcset=[\'\"]([^\'\"]+)[\'\"][^>]*>")
        if srcset:
            first = srcset.split(',')[0].strip().split()[0]
            if first:
                return {"photo_url": urljoin(url, first)}

        # Any <img src="...">
        img = find(r"<img[^>]+src=[\'\"]([^\'\"]+)[\'\"][^>]*>")
        if img:
            return {"photo_url": urljoin(url, img)}

        return {"photo_url": ""}
    except Exception:
        return {"photo_url": ""}

