# ⚙️ Database connection setup (SQLite/Postgres) using SQLAlchemy.
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

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
