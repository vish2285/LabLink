# ResearchMatch 🔎🎓
A full-stack app that helps UC students find professors whose research aligns with their interests, and generates personalized outreach emails to connect with them.  
Built with **React (Vite)** + **FastAPI** + **Postgres/SQLite**.

---

## 🚀 Features
- Student profile input (interests, skills, availability).  
- Professor database (name, department, interests, recent publications).  
- AI-powered matching engine (TF-IDF or embeddings).  
- Ranked list of top professors with publications.  
- One-click outreach email draft (editable + professional).  
- Deployable on **Vercel (frontend)** + **Railway/Render (backend)**.

---

## 🗂 Tech Stack
- **Frontend**: React + Vite + TypeScript, TailwindCSS  
- **Backend**: FastAPI, Python, scikit-learn (TF-IDF), SQLAlchemy  
- **Database**: SQLite (dev), Postgres (prod)  
- **Optional AI**: OpenAI embeddings + LLM for polished emails  
- **Deployment**: Vercel + Railway  

---

## 🏗️ Project Structure

researchmatch/
|─ backend/
|  ├─ app/
|  │  ├─ __init__.py         # marks app/ as a Python package
|  │  ├─ main.py             # 🚀 FastAPI entry point (routes, CORS, app startup)
|  │  ├─ database.py         # ⚙️ SQLAlchemy DB engine + session setup
|  │  ├─ models.py           # 🗄️ SQLAlchemy models (Professor, Student, Match tables)
|  │  ├─ crud.py             # 🛠️ CRUD functions (create student, list professors, etc.)
|  │  ├─ match.py            # 🔍 Matching engine (TF-IDF / embeddings)
|  │  ├─ import_json.py      # 📥 Seeder script to load professors.json into DB
|  │  └─ professors.json     # 📑 Seed dataset with professors + publications
|  │
|  ├─ requirements.txt       # 📦 Backend dependencies (FastAPI, SQLAlchemy, scikit-learn, etc.)
|  ├─ venv/                  # (local only) Python virtual environment
|  └─ professors.db          # (generated) SQLite DB file after first run
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ pages/
│  │  │  ├─ ProfileForm.jsx
│  │  │  ├─ Results.jsx
│  │  │  └─ EmailEditor.jsx
│  │  └─ api.js
│  ├─ package.json
│  └─ README.md
└─ README.md
