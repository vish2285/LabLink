# LabLink 🔎🧪
Connect UC Davis students with professors aligned to their research interests, and draft a polished outreach email in one flow.

Built with **React (Vite + TypeScript + Tailwind)** and **FastAPI + SQLAlchemy + SQLite**.

---

## 🚀 Features
- Profile: interests, skills, optional department
- Results: ranked matches with “why it matches” highlights
- Detail: professor profile, publications, skill tags
- Email: generate a tailored message; send via SMTP with attachment (CV)
- Polished UI: dark theme, responsive, subtle animations (Framer Motion)

---

## 🗂 Tech Stack
- Frontend: React 19, Vite, TypeScript, Tailwind, Framer Motion
- Backend: FastAPI, SQLAlchemy, rank-bm25, optional scikit-learn
- Database: SQLite (local). Postgres can be added in prod
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

Create `backend/.env` (Gmail SMTP example)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=yourgmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=yourgmail@gmail.com
ALLOWED_ORIGINS=http://localhost:5173
```

Run API
```
uvicorn app.main:app --reload --port 8000
```

## ✨ Usage
1. Fill Profile (interests/skills/department)
2. Review Results (top 3 emphasized with subtle animations)
3. Open Email (generate draft, edit)
4. Attach CV (optional) and Send Email (SMTP) or open in Mail

## 🔐 Notes
- For Gmail, enable 2‑Step Verification and use an App Password
- Or swap to SendGrid/SES by replacing the SMTP sender in `email_utils.py`

## 📄 License
MIT
