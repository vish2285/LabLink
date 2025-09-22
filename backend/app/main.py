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

@app.get('/professors/match/{professors_id}')
def match(professors_id: int):
    data = load_data()
    # Find professor by ID
    for professor in data:
        if professor.get('id') == professors_id:
            return professor
    raise HTTPException(status_code=404, detail="Professor not found")

@app.post('/student/profile')
def create_student_profile():
    
    return {"student_id": '001', "ok": True}