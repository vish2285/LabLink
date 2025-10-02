from __future__ import annotations

"""
Copy data from local SQLite to Postgres (Neon).

Usage:
  python -m backend.app.scripts.migrate_sqlite_to_postgres \
    --source sqlite:////absolute/path/to/professors.db \
    --target postgresql://user:pass@host/db?sslmode=require
"""

import argparse
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from .. import models
from ..database import Base


def normalize_pg(url: str) -> str:
  parts = urlsplit(url)
  scheme = 'postgresql+psycopg' if parts.scheme == 'postgresql' else parts.scheme
  return urlunsplit((scheme, parts.netloc, parts.path, parts.query, parts.fragment))


def main():
  p = argparse.ArgumentParser()
  p.add_argument('--source', required=True)
  p.add_argument('--target', required=True)
  args = p.parse_args()

  src_engine = create_engine(args.source, future=True)
  dst_engine = create_engine(normalize_pg(args.target), future=True, pool_pre_ping=True)

  Base.metadata.create_all(bind=dst_engine)

  with Session(bind=src_engine, future=True) as s_src, Session(bind=dst_engine, future=True) as s_dst:
    # Professors
    for p in s_src.scalars(select(models.Professor)).all():
      s_dst.merge(models.Professor(
        id=p.id,
        name=p.name,
        department=p.department,
        email=p.email,
        research_interests=p.research_interests,
        profile_link=p.profile_link,
        photo_url=getattr(p, 'photo_url', ''),
        recent_publications=getattr(p, 'recent_publications', '[]'),
      ))
    s_dst.commit()

    # Skills
    for s in s_src.scalars(select(models.Skill)).all():
      s_dst.merge(models.Skill(id=s.id, name=s.name))
    s_dst.commit()

    # Links
    for ps in s_src.scalars(select(models.ProfessorSkill)).all():
      s_dst.merge(models.ProfessorSkill(id=ps.id, professor_id=ps.professor_id, skill_id=ps.skill_id))
    s_dst.commit()

    # Publications
    for d in s_src.scalars(select(models.Publication)).all():
      s_dst.merge(models.Publication(
        id=d.id,
        professor_id=d.professor_id,
        title=d.title,
        abstract=d.abstract,
        year=d.year,
        link=d.link,
      ))
    s_dst.commit()

  print('✅ Migration complete')


if __name__ == '__main__':
  main()


