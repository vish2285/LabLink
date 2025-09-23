# 🛠️ Helper functions to Create, Read, Update, Delete (CRUD) data in DB.
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from . import models

def list_professors(db: Session, department_substr: Optional[str] = None) -> List[models.Professor]:
    q = db.query(models.Professor).options(
        joinedload(models.Professor.publications),
        joinedload(models.Professor.professor_skills).joinedload(models.ProfessorSkill.skill)
    )
    if department_substr:
        like = f"%{department_substr}%"
        q = q.filter(models.Professor.department.ilike(like))
    return q.all()

def get_professor(db: Session, professor_id: int) -> Optional[models.Professor]:
    return (
        db.query(models.Professor)
        .options(
            joinedload(models.Professor.publications),
            joinedload(models.Professor.professor_skills).joinedload(models.ProfessorSkill.skill)
        )
        .filter(models.Professor.id == professor_id)
        .first()
    )

def list_departments(db: Session) -> List[str]:
    rows = db.query(models.Professor.department).distinct().all()
    deps = sorted([r[0].strip() for r in rows if r and r[0]])
    return deps
