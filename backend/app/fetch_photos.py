import httpx
import os
import json
from app.database import SessionLocal
from app import models

API_BASE = "http://127.0.0.1:8000"

def main():
    db = SessionLocal()
    updated = 0
    fallback_used = 0
    # Build fallback map from local JSON: name -> photo_url
    fallback_map: dict[str, str] = {}
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(here, "data", "professors.json")
        if os.path.isfile(json_path):
            with open(json_path, encoding="utf-8") as f:
                arr = json.load(f)
                if isinstance(arr, list):
                    for obj in arr:
                        try:
                            n = (obj.get("name") or "").strip()
                            u = (obj.get("photo_url") or "").strip()
                            if n and u:
                                fallback_map[n] = u
                        except Exception:
                            pass
    except Exception:
        pass
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
                    else:
                        # Fallback to local JSON mapping by professor name
                        fb = fallback_map.get((getattr(p, "name", "") or "").strip())
                        if fb:
                            p.photo_url = fb
                            db.add(p)
                            updated += 1
                            fallback_used += 1
                except Exception:
                    pass
            if i % 25 == 0:
                db.commit()
        db.commit()
    finally:
        db.close()
    print(f"Updated {updated} professors with photo_url (fallbacks used: {fallback_used})")

if __name__ == "__main__":
    main()
