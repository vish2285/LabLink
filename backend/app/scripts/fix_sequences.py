"""Fix Postgres sequences to align with current max(id) values.

Usage:
  DATABASE_URL=... python -m backend.app.scripts.fix_sequences
"""

from __future__ import annotations

from sqlalchemy import text, create_engine
from ..database import DATABASE_URL  # type: ignore


TABLES = [
    ("skills", "id"),
    ("professors", "id"),
    ("publications", "id"),
    ("professor_skills", "id"),
]


def main():
    engine = create_engine(DATABASE_URL, future=True)
    with engine.begin() as conn:
        for table, col in TABLES:
            # Get sequence name for this table/column
            seq_sql = f"SELECT pg_get_serial_sequence('{table}', '{col}')"
            seq_row = conn.execute(text(seq_sql)).scalar()
            if not seq_row:
                continue
            seq_name = str(seq_row)
            # Get current max id
            max_sql = f"SELECT COALESCE(MAX({col}), 0) FROM {table}"
            max_id = int(conn.execute(text(max_sql)).scalar() or 0)
            # Align the sequence to max id
            set_sql = "SELECT setval(:seqname, :max_id)"
            conn.execute(text(set_sql), {"seqname": seq_name, "max_id": max_id})
    print("✅ Sequences aligned with max IDs")


if __name__ == "__main__":
    main()


