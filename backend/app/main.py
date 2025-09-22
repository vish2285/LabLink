# 🚀 Entry point of the FastAPI app. Defines routes (/student, /professors, /email).

from fastapi import FastAPI, Path, HTTPException, Query
# from .database import Base, engine
# Base.metadata.create_all(bind=engine)
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field, computed_field
from typing import Annotated, Optional
import json
import os

app = FastAPI()

# class Match (BaseModel):
#     id :

def load_data():
    # Get the directory where this file is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'professors.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    return data

@app.get('/view')
def view():
    data = load_data()
    return data


@app.get("/health")
def health():
    return {"ok": True}

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


