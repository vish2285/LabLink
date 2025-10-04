# LabLink 🔎🧪
Connect UC Davis students with professors aligned to their research interests, and draft a polished outreach email in one flow.

**Live app**: `https://lablinkdavis.org` 

Built with **React (Vite + TypeScript + Tailwind)** and **FastAPI + SQLAlchemy**, using **SQLite** locally and **PostgreSQL/Neon** in production. Matching blends lexical (TF‑IDF/BM25), semantic embeddings, skill overlap, and publication recency.

---

## 🚀 Features
- Profile: interests, skills, optional department
- Matching: hybrid ranking (TF‑IDF + BM25 + semantic embeddings), skill coverage (F1 + Jaccard), publication recency
- Results: ranked list with transparent “why it matches” highlights
- Detail: professor profile, publications, skill tags
- Email: generate a tailored message; send via SMTP with attachment (CV)
- Polished UI: dark theme, responsive, subtle animations (Framer Motion)

---

## 🗂 Tech Stack
- Frontend: React 19, Vite, TypeScript, Tailwind, Framer Motion
- Backend: FastAPI, SQLAlchemy, rank-bm25, sentence-transformers (embeddings), optional scikit-learn (TF‑IDF)
- Database: SQLite (local). PostgreSQL (e.g., Neon) supported for production
- Auth: Google OAuth (token verification) with domain enforcement
- Email: SMTP (Gmail app password) or swap to SendGrid

---

## 🏗️ Project Structure

```
LabLink/
├─ backend/
│  ├─ app/
│  │  ├─ main.py            # FastAPI app, routes, seeding, CORS
│  │  ├─ schema.py          # Pydantic models
│  │  ├─ models.py          # SQLAlchemy models
│  │  ├─ crud.py            # DB access helpers
│  │  ├─ matching.py        # Vector store + scoring
│  │  ├─ email_utils.py     # Draft builder + SMTP send
│  │  └─ data/              # optional JSON seed
│  ├─ requirements.txt
│  └─ professors.db         # generated SQLite
└─ frontend/
   ├─ src/
   │  ├─ pages/ (Landing, ProfileForm, Results, ProfessorDetail, EmailEditor, About, Feedback)
   │  ├─ components/ (Button, ProfessorCard, Avatar, FAQ, etc.)
   │  └─ context/ (AppContext)
   └─ public/lablink.png    # favicon/app icon
```

## 🔧 Local Setup

Frontend
```
cd frontend
npm install
npm run dev
```

Backend
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (minimal example)
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
ALLOWED_ORIGINS=http://localhost:5173
ALLOWED_EMAIL_DOMAINS=ucdavis.edu
ALLOWED_HOSTS=
SESSION_COOKIE_NAME=lablink_session
SESSION_TTL_SECONDS=1800
COOKIE_DOMAIN=
COOKIE_SECURE=0
COOKIE_SAMESITE=lax
HSTS_ENABLED=1
# SMTP (if sending via server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourgmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=yourgmail@gmail.com
# Optional (use Postgres instead of SQLite)
# DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require
```

Run API
```
uvicorn app.main:app --reload --port 8000
```

### Seed / Reseed from JSON
The repository ships with `backend/app/data/professors.json`. You can wipe and reseed the DB at any time:

SQLite (default)
```
cd backend
python -m app.seed_json
curl http://localhost:8000/api/reload_docs
```

PostgreSQL (Neon)
```
cd backend
export DATABASE_URL='postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require'
python -m app.seed_json
curl http://localhost:8000/api/reload_docs
```

`/api/reload_docs` rebuilds lexical and semantic indices without restarting the server.

### Memory-constrained deploys (Render, etc.)
Semantic embeddings are optional and disabled by default in production to avoid OOM on small instances. To enable:
```
# In your deploy environment
SEMANTIC_ENABLED=1
# Optional: choose a tiny model
SEMANTIC_MODEL=sentence-transformers/paraphrase-MiniLM-L3-v2
```
If you omit `SEMANTIC_ENABLED`, the backend will run with purely lexical interest matching (TF‑IDF/BM25) and skills/publications.

Frontend env (for GIS client ID)
```
cd frontend
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_ALLOWED_EMAIL_DOMAINS=ucdavis.edu
VITE_API_BASE=
```

## ✨ Usage
1. Fill Profile (interests/skills/department)
2. Review Results (top 3 emphasized with subtle animations)
3. Open Email (generate draft, edit)
4. Attach CV (optional) and Send Email (SMTP) or open in Mail

### Matching API (tunable weights)
`POST /api/match?department=Computer%20Science&w_interests=0.55&w_skills=0.35&w_pubs=0.10`

Body example:
```
{
  "name": "Student",
  "email": "student@ucdavis.edu",
  "interests": "computer vision, robustness, NLP",
  "skills": "python, pytorch, cuda"
}
```

Response includes ranked matches with `score`, `score_percent`, and `why` details.

## 🔐 Notes
- For Gmail, enable 2‑Step Verification and use an App Password
- Or swap to SendGrid/SES by replacing the SMTP sender in `email_utils.py`
 - Ensure your Google OAuth client matches allowed domains; backend verifies Google ID tokens and enforces `ALLOWED_EMAIL_DOMAINS`.

## 📄 License
MIT
