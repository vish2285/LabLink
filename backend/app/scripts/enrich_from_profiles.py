"""
Enrich professors' research_interests and skills by scraping their UC Davis profile pages.

Heuristics-only (no heavy parsing library) to keep dependencies light:
 - Pull HTML with httpx
 - Look for sections containing 'research interests', 'research areas', 'interests', 'research'
 - Extract the following bullet list or comma-separated phrases
 - Normalize to a concise string and map to skill tokens

Usage:
  python -m backend.app.scripts.enrich_from_profiles [--limit 20] [--dry-run]
"""

from __future__ import annotations

import re
import time
import argparse
from typing import Iterable, List

import httpx
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models
from ..matching import norm_text, tokenize


HEADERS = {
    "User-Agent": "LabLinkDataBot/1.0 (contact: lablinkdavis@gmail.com)",
}

# Common CS keywords we treat as skills if observed on the page
SKILL_LEXICON = [
    # AI/ML/NLP/CV
    "machine learning", "deep learning", "artificial intelligence", "nlp", "natural language processing",
    "information extraction", "knowledge graphs", "computer vision", "transformers", "reinforcement learning",
    # Systems / Security
    "operating systems", "computer architecture", "distributed systems", "databases", "security",
    "cybersecurity", "network security", "internet measurement", "embedded systems", "fpga",
    # Theory / PL / SE
    "algorithms", "theoretical computer science", "programming languages", "compilers",
    "software engineering", "formal methods", "verification", "program analysis", "static analysis",
    "dynamic analysis", "automated reasoning", "program synthesis",
    # Data / Viz / HCI
    "data mining", "data science", "visualization", "human-computer interaction",
    # Quant / HPC
    "high-performance computing", "hpc", "simulation", "quantum computing",
]


def extract_interest_text(html: str) -> str:
    """Return a concise interest string from the profile HTML (best-effort)."""
    if not html:
        return ""
    # Simplify whitespace; keep a copy with tags for structural hints
    text_only = re.sub(r"<[^>]+>", " ", html, flags=re.IGNORECASE)
    text_only = re.sub(r"\s+", " ", text_only).strip()

    # Try to find explicit headings
    LOWER = html.lower()
    anchors = [
        ("research interests", LOWER.find("research interests")),
        ("research areas", LOWER.find("research areas")),
        ("interests", LOWER.find("interests")),
        ("research", LOWER.find("<h2>research")),
    ]
    anchors = [(k, i) for k, i in anchors if i >= 0]
    if anchors:
        # Take the earliest reliable anchor
        _, idx = sorted(anchors, key=lambda t: t[1])[0]
        window = html[idx: idx + 1800]
        # Prefer list items near the anchor
        lis = re.findall(r"<li[^>]*>(.*?)</li>", window, flags=re.IGNORECASE | re.DOTALL)
        if lis:
            cleaned = [re.sub(r"<[^>]+>", " ", li).strip() for li in lis]
            parts = [re.sub(r"\s+", " ", x) for x in cleaned if x]
            return ", ".join(parts[:12])
        # Else, grab paragraph following
        m = re.search(r"<p[^>]*>(.*?)</p>", window, flags=re.IGNORECASE | re.DOTALL)
        if m:
            para = re.sub(r"<[^>]+>", " ", m.group(1))
            para = re.sub(r"\s+", " ", para).strip()
            # trim after a sentence or semicolon burst
            return para[:400]

    # Secondary source: try meta description
    mmeta = re.search(r"<meta[^>]+name=[\'\"]description[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]", html, flags=re.IGNORECASE)
    if mmeta:
        desc = re.sub(r"\s+", " ", mmeta.group(1)).strip()
        if desc:
            return desc[:400]

    # Fallback: search in plain text around keywords
    plain = text_only.lower()
    for kw in ["research interests", "research areas", "interests", "research"]:
        i = plain.find(kw)
        if i >= 0:
            snippet = text_only[i: i + 300]
            return snippet.strip()
    return ""


def extract_skills_from_text(text: str) -> List[str]:
    s = norm_text(text)
    found: List[str] = []
    for lex in SKILL_LEXICON:
        if lex in s:
            found.append(lex)
    # Deduplicate and keep order
    seen, out = set(), []
    for k in found:
        if k not in seen:
            seen.add(k); out.append(k)
    return out[:20]


def enrich(limit: int | None = None, dry_run: bool = False, delay_s: float = 0.6) -> int:
    db: Session = SessionLocal()
    client = httpx.Client(headers=HEADERS, timeout=10.0)
    updated = 0
    try:
        profs = db.query(models.Professor).order_by(models.Professor.id.asc()).all()
        if limit is not None:
            profs = profs[:limit]
        for i, p in enumerate(profs, 1):
            url = (p.profile_link or '').strip()
            if not url:
                continue
            try:
                resp = client.get(url)
                resp.raise_for_status()
                html = resp.text
            except Exception:
                continue

            interests = extract_interest_text(html)
            skills = extract_skills_from_text(interests) if interests else []

            if interests or skills:
                updated += 1
                if not dry_run:
                    if interests:
                        p.research_interests = interests[:1000]
                    # Upsert skills
                    for name in skills:
                        name_norm = name.strip().lower()
                        if not name_norm:
                            continue
                        sk = db.query(models.Skill).filter(models.Skill.name == name_norm).first()
                        if not sk:
                            sk = models.Skill(name=name_norm)
                            db.add(sk)
                            db.flush()
                        # Link if missing
                        exists = db.query(models.ProfessorSkill).filter(
                            models.ProfessorSkill.professor_id == p.id,
                            models.ProfessorSkill.skill_id == sk.id
                        ).first()
                        if not exists:
                            db.add(models.ProfessorSkill(professor_id=p.id, skill_id=sk.id))
                if not dry_run and (i % 15 == 0):
                    db.commit()
            time.sleep(delay_s)
        if not dry_run:
            db.commit()
    finally:
        client.close()
        db.close()
    return updated


def main():
    ap = argparse.ArgumentParser(description="Enrich professor interests and skills from profile pages")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    n = enrich(limit=a.limit, dry_run=a.dry_run)
    print(f"✅ Enrichment processed {n} professors")


if __name__ == "__main__":
    main()


