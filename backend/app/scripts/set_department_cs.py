from sqlalchemy.orm import Session
from ..database import SessionLocal, Base, engine
from .. import models

TARGET_DEPARTMENT = "Computer Science"

def run():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        for p in db.query(models.Professor).all():
            p.department = TARGET_DEPARTMENT
        db.commit()
        print(f"✅ Updated all professors' department to '{TARGET_DEPARTMENT}'.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
