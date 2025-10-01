# 🗄️ Database schema definitions (Professor, Student, Match tables).
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Text, ForeignKey, UniqueConstraint
from .database import Base

class Professor(Base):
    __tablename__ = "professors"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    department: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    research_interests: Mapped[str | None] = mapped_column(Text)
    profile_link: Mapped[str | None] = mapped_column(String(512))
    photo_url: Mapped[str | None] = mapped_column(String(512), default="")
    recent_publications: Mapped[str | None] = mapped_column(Text, default="[]")  # JSON string for backward compatibility

    publications: Mapped[list["Publication"]] = relationship(
        back_populates="professor", cascade="all, delete-orphan"
    )
    professor_skills: Mapped[list["ProfessorSkill"]] = relationship(
        back_populates="professor", cascade="all, delete-orphan"
    )

class Publication(Base):
    __tablename__ = "publications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    professor_id: Mapped[int] = mapped_column(ForeignKey("professors.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(Text)
    abstract: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int | None] = mapped_column(Integer)
    link: Mapped[str | None] = mapped_column(String(512))

    professor: Mapped["Professor"] = relationship(back_populates="publications")

class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)

class ProfessorSkill(Base):
    __tablename__ = "professor_skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    professor_id: Mapped[int] = mapped_column(ForeignKey("professors.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)

    professor: Mapped["Professor"] = relationship(back_populates="professor_skills")
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (UniqueConstraint("professor_id", "skill_id", name="uq_prof_skill"),)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Google subject (immutable, use as stable external ID)
    sub: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    picture: Mapped[str | None] = mapped_column(String(512))


class SessionToken(Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[int] = mapped_column(Integer)  # unix epoch seconds

    user: Mapped["User"] = relationship()
