# 🛠️ Helper functions to Create, Read, Update, Delete (CRUD) data in DB.
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from . import models
import secrets, time

def list_professors(db: Session, department_substr: Optional[str] = None, limit: Optional[int] = None, offset: Optional[int] = None) -> List[models.Professor]:
    q = db.query(models.Professor).options(
        joinedload(models.Professor.publications),
        joinedload(models.Professor.professor_skills).joinedload(models.ProfessorSkill.skill)
    )
    if department_substr:
        like = f"%{department_substr}%"
        q = q.filter(models.Professor.department.ilike(like))
    
    if offset:
        q = q.offset(offset)
    if limit:
        q = q.limit(limit)
    
    return q.all()

def count_professors(db: Session, department_substr: Optional[str] = None) -> int:
    """Count total professors matching the criteria"""
    q = db.query(models.Professor)
    if department_substr:
        like = f"%{department_substr}%"
        q = q.filter(models.Professor.department.ilike(like))
    return q.count()

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


def get_or_create_user_by_sub(db: Session, sub: str, *, email: str, name: Optional[str], picture: Optional[str]) -> models.User:
    user = db.query(models.User).filter(models.User.sub == sub).first()
    if user:
        # update mutable fields
        changed = False
        if email and user.email != email:
            user.email = email
            changed = True
        if (name or None) != user.name:
            user.name = name or None
            changed = True
        if (picture or None) != user.picture:
            user.picture = picture or None
            changed = True
        if changed:
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    user = models.User(sub=sub, email=email, name=name or None, picture=picture or None)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_session(db: Session, user: models.User, *, ttl_seconds: int = 1800) -> models.SessionToken:
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + ttl_seconds
    sess = models.SessionToken(user_id=user.id, token=token, expires_at=expires_at)
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess

def get_session(db: Session, token: str) -> Optional[models.SessionToken]:
    return db.query(models.SessionToken).filter(models.SessionToken.token == token).first()

def delete_session(db: Session, token: str) -> None:
    obj = db.query(models.SessionToken).filter(models.SessionToken.token == token).first()
    if obj:
        db.delete(obj)
        db.commit()
