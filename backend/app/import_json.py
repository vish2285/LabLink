import os, json
from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from .models import Professor

def seed():
    # Ensure tables exist before seeding
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if db.query(Professor).first():
            return
        here = os.path.dirname(os.path.abspath(__file__))
        data = json.load(open(os.path.join(here, "professors.json"), "r", encoding="utf-8"))
        for i, p in enumerate(data, start=1):
            db.merge(Professor(
                id=int(p.get("id") or i),
                name=p.get("name",""),
                department=p.get("department"),
                email=p.get("email"),
                profile_link=p.get("profile_link"),
                research_interests=p.get("research_interests"),
                personal_site=p.get("personal_site"),
                photo_url=(p.get("photo_url") or ""),
            ))
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed()