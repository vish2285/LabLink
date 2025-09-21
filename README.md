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
- **Frontend**: React + Vite, TailwindCSS  
- **Backend**: FastAPI, Python, scikit-learn (TF-IDF), SQLAlchemy  
- **Database**: SQLite (dev), Postgres (prod)  
- **Optional AI**: OpenAI embeddings + LLM for polished emails  
- **Deployment**: Vercel + Railway  

---

## 🏗️ Project Structure

researchmatch/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ models.py
│  │  ├─ crud.py
│  │  ├─ match.py
│  │  └─ scrape_seed.py
│  ├─ requirements.txt
│  └─ README.md
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
