import json, os
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models

def seed_from_json(json_path: str):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with SessionLocal.begin() as db:  # auto-commit/rollback
        # wipe existing
        db.query(models.ProfessorSkill).delete()
        # Publication model removed
        db.query(models.Skill).delete()
        db.query(models.Professor).delete()

        skill_cache: dict[str, models.Skill] = {}

        for p in data:
            prof = models.Professor(
                id=p.get("id"),
                name=p.get("name",""),
                department=p.get("department"),
                email=p.get("email"),
                research_interests=p.get("research_interests"),
                profile_link=p.get("profile_link"),
                personal_site=p.get("personal_site"),
                photo_url=(p.get("photo_url") or ""),
            )
            db.add(prof)
            db.flush()  # ensure prof.id

            # publications removed

            # skills (dedupe via cache)
            for s in p.get("skills") or []:
                key = (s or "").strip().lower()
                if not key:
                    continue
                if key not in skill_cache:
                    sk = models.Skill(name=key)
                    db.add(sk)
                    db.flush()
                    skill_cache[key] = sk
                db.add(models.ProfessorSkill(professor_id=prof.id, skill_id=skill_cache[key].id))

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    Base.metadata.create_all(bind=engine)
    here = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(here, "data", "professors.json")
    seed_from_json(json_path)
    print("✅ Seeded database from JSON.")
