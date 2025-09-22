from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json


app = FastAPI(title="ResearchMatch API")

# CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_PATH = Path(__file__).parent / "professors.json"
if DATA_PATH.exists():
    with DATA_PATH.open("r", encoding="utf-8") as f:
        PROFESSORS = json.load(f)
else:
    PROFESSORS = []


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/professors")
def list_professors():
    return PROFESSORS


@app.get("/api/departments")
def list_departments():
    # Return sorted unique list of departments present in the dataset
    departments = sorted({(p.get("department") or "").strip() for p in PROFESSORS if p.get("department")})
    return departments


@app.post("/api/match")
def match(profile: dict):
    # Placeholder matching: return top 10
    return PROFESSORS[:10]


