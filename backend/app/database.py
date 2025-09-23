# ⚙️ Database connection setup (SQLite/Postgres) using SQLAlchemy.
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
<<<<<<< HEAD
=======
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
>>>>>>> ea5d1c44271542f3a96fece680b6e3e775218de2

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# SQLite needs this arg; other drivers ignore it
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    future=True,
    echo=False,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
