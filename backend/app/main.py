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
    ProfessorOut, StudentProfileIn,
    MatchResponse, MatchItem, EmailRequest, EmailDraft
)
from .matching import (
    prof_to_doc, VectorStore, extract_skills, jaccard, tokenize, norm_text,
    expand_query_text, SemanticIndex
)
from .matching import CrossEncoderReranker
from .email_utils import build_email, send_email_with_attachment
import httpx
import base64
from urllib.parse import urljoin
from datetime import datetime, timedelta
from typing import Optional, Any
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import secrets

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
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

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
    response: Response = None,
) -> dict:
    # Prefer cookie-based session
    if session_token:
        sess = crud.get_session(db, session_token)
        if not sess:
            raise HTTPException(401, "Invalid or expired session")
        # Sliding session: refresh TTL on access and refresh cookie expiry
        try:
            crud.touch_session(db, sess, ttl_seconds=SESSION_TTL_SECONDS)
        except Exception:
            pass
        user = db.query(models.User).filter(models.User.id == sess.user_id).first()
        if not user:
            raise HTTPException(401, "User not found")
        try:
            # Refresh cookie expiry so active users stay signed in
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
        except Exception:
            pass
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
    # Publications removed; keep stub returning empty list for compatibility
    return []

def rebuild_vectorstore(db: Session):
    global VECSTORE, SEM_INDEX, DOCS, PROF_IDS
    profs = crud.list_professors(db)
    PROF_IDS = [p.id for p in profs]
    # flatten professor record to dict expected by prof_to_doc
    payloads = []
    for p in profs:
        skills = [ps.skill.name for ps in p.professor_skills]
        payloads.append({
            "research_interests": p.research_interests or "",
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
                                    db.add(models.Professor(
                                        name=name,
                                        department=dept or None,
                                        email=email or None,
                                        research_interests=interests or None,
                                        profile_link=None,
                                        photo_url="",
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

@app.get("/api/reload_docs")
def reload_docs(db: Session = Depends(get_db)):
    rebuild_vectorstore(db)
    return {"ok": True, "count": len(PROF_IDS)}

# ---- Helper to build OAuth redirect_uri respecting proxy headers ----
def build_oauth_redirect_uri(request: Request) -> str:
    """Build redirect_uri for OAuth, respecting X-Forwarded-Host and X-Forwarded-Proto from proxies."""
    from starlette.datastructures import URL
    raw_redirect = str(request.url_for("oauth_callback"))
    redirect_url = URL(raw_redirect)
    # Use forwarded proto if present
    fproto = (request.headers.get("x-forwarded-proto") or "").lower()
    if fproto in {"http", "https"} and redirect_url.scheme != fproto:
        redirect_url = redirect_url.replace(scheme=fproto)
    # Use forwarded host if present (critical for Vercel proxy setup)
    fhost = request.headers.get("x-forwarded-host")
    if fhost:
        # Take the first host if multiple are comma-separated
        fhost = fhost.split(",")[0].strip()
        if fhost and fhost != redirect_url.netloc:
            redirect_url = redirect_url.replace(netloc=fhost)
    return str(redirect_url)

# ---- Classic OAuth (Authorization Code) flow ----
@app.get("/api/oauth/start")
def oauth_start(request: Request, returnTo: Optional[str] = "/"):
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        raise HTTPException(500, "Server misconfigured: missing Google OAuth credentials")
    # Build redirect_uri respecting proxy headers
    try:
        redirect_uri = build_oauth_redirect_uri(request)
    except Exception:
        redirect_uri = str(request.url_for("oauth_callback"))
    logger.info(f"OAuth START redirect_uri = {redirect_uri}")
    state = secrets.token_urlsafe(32)
    scopes = [
        "openid",
        "email",
        "profile",
        # Include Gmail scopes to display the full consent screen
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
    ]
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "include_granted_scopes": "false",
        "prompt": "consent select_account",
        "state": state,
    }
    if ALLOWED_EMAIL_DOMAINS:
        params["hd"] = sorted(ALLOWED_EMAIL_DOMAINS)[0]
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    resp = RedirectResponse(url)
    # Store state and return path in short-lived cookies
    resp.set_cookie("oauth_state", state, max_age=600, httponly=True, secure=COOKIE_SECURE, samesite="lax", domain=COOKIE_DOMAIN, path="/")
    # Allow absolute returnTo only if it matches an allowed origin; else allow app-relative path
    safe_return = "/"
    try:
        if isinstance(returnTo, str) and returnTo:
            if returnTo.startswith("http://") or returnTo.startswith("https://"):
                allowed = {o.strip().rstrip('/') for o in ALLOWED_ORIGINS if o.strip()}
                # extract origin
                from urllib.parse import urlsplit
                rt = urlsplit(returnTo)
                origin = f"{rt.scheme}://{rt.netloc}"
                if origin in allowed:
                    safe_return = returnTo
            elif returnTo.startswith("/"):
                safe_return = returnTo
    except Exception:
        safe_return = "/"
    resp.set_cookie("oauth_return", safe_return, max_age=600, httponly=True, secure=COOKIE_SECURE, samesite="lax", domain=COOKIE_DOMAIN, path="/")
    return resp

# ---- Cookie helper ----

def set_session_cookie(resp: Response | RedirectResponse, token: str) -> None:
    try:
        expires = datetime.utcnow() + timedelta(seconds=SESSION_TTL_SECONDS)
        resp.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite="none" if COOKIE_SAMESITE == "none" else ("strict" if COOKIE_SAMESITE == "strict" else "lax"),
            domain=COOKIE_DOMAIN,
            expires=expires.strftime("%a, %d %b %Y %H:%M:%S GMT"),
            path="/",
        )
    except Exception:
        pass

@app.get("/api/oauth/callback")
async def oauth_callback(request: Request, response: Response, code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None, db: Session = Depends(get_db)):
    if error:
        raise HTTPException(400, f"OAuth error: {error}")
    if not code:
        raise HTTPException(400, "Missing authorization code")
    # Validate state
    cookie_state = request.cookies.get("oauth_state")
    if not cookie_state or cookie_state != (state or ""):
        raise HTTPException(400, "Invalid OAuth state")
    # Exchange code for tokens (async)
    # Build redirect_uri respecting proxy headers
    try:
        redirect_uri = build_oauth_redirect_uri(request)
    except Exception:
        redirect_uri = str(request.url_for("oauth_callback"))
    logger.info(f"OAuth CALLBACK redirect_uri = {redirect_uri}")
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_res = await client.post("https://oauth2.googleapis.com/token", data=data)
        token_res.raise_for_status()
        payload = token_res.json()
        id_token = payload.get("id_token")
        if not id_token:
            raise HTTPException(400, "Missing id_token in token response")
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"OAuth token exchange failed: {e}")
    # Redirect back to app
    ret = request.cookies.get("oauth_return") or "/"
    r = RedirectResponse(ret)
    set_session_cookie(r, sess.token)
    # Clear temporary cookies
    try:
        r.delete_cookie("oauth_state", domain=COOKIE_DOMAIN, path="/")
        r.delete_cookie("oauth_return", domain=COOKIE_DOMAIN, path="/")
    except Exception:
        pass
    return r

# ---- Helpers ----
def clamp01(x: float) -> float: return max(0.0, min(1.0, x))
def pct(x: float) -> float: return round(clamp01(x) * 100.0, 2)

def to_prof_out(p) -> ProfessorOut:
    skills = [ps.skill.name for ps in p.professor_skills]
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
        skills=skills
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
    if not session_token:
        # no session to clear
        response.delete_cookie(
            key=SESSION_COOKIE_NAME,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite="none" if COOKIE_SAMESITE == "none" else ("strict" if COOKIE_SAMESITE == "strict" else "lax"),
            domain=COOKIE_DOMAIN,
            path="/",
        )
        return {"ok": True}
    try:
        crud.delete_session(db, session_token)
    except Exception:
        pass
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none" if COOKIE_SAMESITE == "none" else ("strict" if COOKIE_SAMESITE == "strict" else "lax"),
        domain=COOKIE_DOMAIN,
        path="/",
    )
    return {"ok": True}

@app.post("/api/auth/refresh")
def auth_refresh(response: Response, db: Session = Depends(get_db), session_token: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME)):
    if not session_token:
        raise HTTPException(401, "Missing session")
    sess = crud.get_session(db, session_token)
    if not sess:
        raise HTTPException(401, "Invalid or expired session")
    # extend and reissue cookie
    try:
        crud.touch_session(db, sess, ttl_seconds=SESSION_TTL_SECONDS)
    except Exception:
        pass
    # respond with refreshed cookie
    r = Response(content=json.dumps({"ok": True}), media_type="application/json")
    set_session_cookie(r, sess.token)
    return r

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
    deps = crud.list_departments(db)
    return deps

# ---- Matching endpoints ----
@app.post("/api/match", response_model=MatchResponse)
def match_professors(
    profile: StudentProfileIn,
    department: Optional[str] = Query(None),
    user: dict = Depends(require_ucdavis_user),
):
    query_text = norm_text((profile.interests or ""))

    profs = crud.list_professors(db=next(get_db()), department_substr=department or None)

    # fixed weights (request does not carry weights)
    w_interests = 0.6
    w_skills = 0.4
    w_pubs = 0.0

    # Expand query with synonyms and extracted skills
    expanded = expand_query_text(query_text, profile.skills or "")

    scored: list[tuple[float, int, int, Any, dict]] = []
    for p in profs:
        prof_skills = [ps.skill.name for ps in p.professor_skills]
        # Tokenize interests and compute similarity
        tokens = tokenize(p.research_interests or "")
        # Cosine-like: overlap of content words approximated by Jaccard on token sets
        A = set(tokens)
        B = set(tokenize(expanded))
        inter = len(A & B)
        prec = inter / len(B) if B else 0.0
        rec = inter / len(A) if A else 0.0
        sim_interests = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        # Skill overlap score
        student_skills = extract_skills(profile.skills or "")
        jac, skill_hits = jaccard(student_skills, prof_skills)
        # Convert overlap into precision/recall and F1
        A2, B2 = set(student_skills), set(prof_skills)
        inter2 = len(A2 & B2)
        prec2 = inter2 / len(B2) if B2 else 0.0
        rec2 = inter2 / len(A2) if A2 else 0.0
        f1 = (2 * prec2 * rec2 / (prec2 + rec2)) if (prec2 + rec2) > 0 else 0.0
        skill_score = clamp01(0.7 * f1 + 0.3 * jac)

        # Combine with weights
        base = clamp01(w_interests * sim_interests + w_skills * skill_score)

        # Small bonus for longer interest descriptions implying coverage
        bonus = 1.0
        if len(tokens) > 50:
            bonus *= 1.05

        # synergy bonus when both interests and skills are strong
        synergy = 1.0
        if sim_interests >= 0.5 and skill_score >= 0.5:
            synergy = 1.08
        # penalize weak skill coverage
        if f1 < 0.3:
            synergy *= 0.85
        final = clamp01(base * bonus * synergy)

        # explanatory hits
        interest_hits = sorted(list(A & B))[:6]
        why = {
            "interests_hits": interest_hits,
            "skills_hits": skill_hits[:6],
            "pubs_hits": []
        }
        scored.append((final, len(skill_hits), -p.id, p, why))

    scored.sort(reverse=True, key=lambda x: (x[0], x[1], x[2]))

    # Preliminary selection before optional reranking
    prelim = [t for t in scored if t[0] > 0.0]
    # Cap prelim to reasonable size
    prelim = prelim[:100] if prelim else []

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

    # Final selection
    selected = [t for t in prelim if t[0] > 0.0]

    # Fallback suggestions when nothing meaningful matches
    if not selected:
        suggestions: list[tuple[float, int, int, Any, dict]] = []
        student_skills = extract_skills(profile.skills or "")
        for p in profs:
            prof_skills = [ps.skill.name for ps in p.professor_skills]
            # Skill-based suggestion if user provided skills
            if student_skills:
                jac, skill_hits = jaccard(student_skills, prof_skills)
                A, B = set(student_skills), set(prof_skills)
                inter = len(A & B)
                prec = inter / len(B) if B else 0.0
                rec = inter / len(A) if A else 0.0
                f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
                s = clamp01(f1 * 0.8 + jac * 0.2)
                why = {"interests_hits": [], "skills_hits": skill_hits[:6], "pubs_hits": []}
            else:
                # Otherwise suggest by general coverage of interests text length
                tokens = tokenize(p.research_interests or "")
                s = clamp01(min(len(tokens) / 50.0, 1.0))
                # show top two frequent-ish tokens to give context
                hits = sorted(list(set(tokens)))[:2]
                why = {"interests_hits": hits, "skills_hits": [], "pubs_hits": []}
            suggestions.append((s, len(prof_skills), -p.id, p, why))
        suggestions.sort(reverse=True, key=lambda x: (x[0], x[1], x[2]))
        selected = suggestions[:10]

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
        topic=req.topic,
        student_level=req.student_level,
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
    # simple rate limit per user/email for send: 3/min
    key = f"email:{str(user.get('email') or user.get('sub') or 'anon')}"
    now = int(datetime.utcnow().timestamp())
    window = 60
    bucket = _EMAIL_SEND_EVENTS.get(key, [])
    bucket = [t for t in bucket if (now - t) <= window]
    if len(bucket) >= 3:
        raise HTTPException(429, "Too many emails. Try again in a minute.")
    bucket.append(now)
    _EMAIL_SEND_EVENTS[key] = bucket

    # Validate basic fields
    if not to or not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", to):
        raise HTTPException(422, "Invalid recipient email")
    if not subject or len(subject) > 200:
        raise HTTPException(422, "Invalid subject")
    if not body or len(body) > 20000:
        raise HTTPException(422, "Invalid body content")

    # Attachment limit 5MB
    MAX_ATTACH = 5 * 1024 * 1024
    if filename and file_b64:
        try:
            data = base64.b64decode(file_b64)
            if len(data) > MAX_ATTACH:
                raise HTTPException(413, "Attachment too large (max 5MB)")
        except Exception:
            raise HTTPException(400, "Invalid attachment encoding")

    # Send (mock or real)
    try:
        send_email_with_attachment(to=to, subject=subject, body=body, filename=filename, file_b64=file_b64)
    except Exception as e:
        raise HTTPException(500, f"Failed to send email: {e}")

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

