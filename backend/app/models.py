# 🗄️ Database schema definitions (Professor, Student, Match tables).
from sqlalchemy import Column, Integer, String, Text
from .database import Base

class Professor(Base):
    __tablename__ = "professors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="")
    department = Column(String(255), default="")
    email = Column(String(255), default="")
    profile_link = Column(String(512), default="")
    research_interests = Column(Text, default="")      # store as text
    recent_publications = Column(Text, default="[]")   # JSON string
    