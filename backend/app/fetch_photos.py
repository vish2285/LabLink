import httpx
from app.database import SessionLocal
from app import models

API_BASE = "http://127.0.0.1:8000"

def main():
    db = SessionLocal()
    updated = 0
    try:
        profs = db.query(models.Professor).all()
        for i, p in enumerate(profs, 1):
            if not getattr(p, "photo_url", "") and getattr(p, "profile_link", ""):
                try:
                    r = httpx.get(f"{API_BASE}/api/scrape_photo", params={"url": p.profile_link}, timeout=10.0)
                    r.raise_for_status()
                    photo_url = (r.json() or {}).get("photo_url") or ""
                    if photo_url:
                        p.photo_url = photo_url
                        db.add(p)
                        updated += 1
                except Exception:
                    pass
            if i % 25 == 0:
                db.commit()
        db.commit()
    finally:
        db.close()
    print(f"Updated {updated} professors with photo_url")

if __name__ == "__main__":
    main()
