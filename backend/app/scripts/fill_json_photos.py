import os
import json
from urllib.parse import urljoin
import re
import httpx


def scrape_photo(url: str) -> str:
    try:
        resp = httpx.get(url, timeout=8.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        })
        resp.raise_for_status()
        html = resp.text

        def find(pattern: str) -> str | None:
            m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else None

        # OpenGraph variants
        for pat in [
            r"<meta[^>]+property=['\"]og:image:url['\"][^>]+content=['\"]([^'\"]+)['\"]",
            r"<meta[^>]+property=['\"]og:image['\"][^>]+content=['\"]([^'\"]+)['\"]",
            r"<meta[^>]+name=['\"]og:image['\"][^>]+content=['\"]([^'\"]+)['\"]",
        ]:
            val = find(pat)
            if val:
                return urljoin(url, val)

        # Twitter card
        tw = find(r"<meta[^>]+name=['\"]twitter:image['\"][^>]+content=['\"]([^'\"]+)['\"]")
        if tw:
            return urljoin(url, tw)

        # <link rel="image_src">
        link_img = find(r"<link[^>]+rel=['\"]image_src['\"][^>]+href=['\"]([^'\"]+)['\"]")
        if link_img:
            return urljoin(url, link_img)

        # UC Davis directory profile images
        uc_img = find(r"<img[^>]+src=['\"]([^'\"]*/styles/sf_profile/public/[^'\"]+)['\"][^>]*>")
        if uc_img:
            return urljoin(url, uc_img)

        # srcset attribute
        srcset = find(r"<img[^>]+srcset=['\"]([^'\"]+)['\"][^>]*>")
        if srcset:
            first = srcset.split(',')[0].strip().split()[0]
            if first:
                return urljoin(url, first)

        # Any <img src="...">
        img = find(r"<img[^>]+src=['\"]([^'\"]+)['\"][^>]*>")
        if img:
            return urljoin(url, img)
    except Exception:
        pass
    return ""


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(here, "data", "professors.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0
    for obj in data:
        try:
            photo_url = (obj.get("photo_url") or "").strip()
            profile_link = (obj.get("profile_link") or "").strip()
            if (not photo_url) and profile_link:
                found = scrape_photo(profile_link)
                if found:
                    obj["photo_url"] = found
                    updated += 1
        except Exception:
            continue

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated {updated} photo_url entries in {json_path}")


if __name__ == "__main__":
    main()

import os
import json
from urllib.parse import urljoin
import re
import httpx


def scrape_photo(url: str) -> str:
    try:
        resp = httpx.get(url, timeout=8.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        })
        resp.raise_for_status()
        html = resp.text

        def find(pattern: str) -> str | None:
            m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else None

        # OpenGraph variants
        for pat in [
            r"<meta[^>]+property=[\'\"]og:image:url[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
            r"<meta[^>]+property=[\'\"]og:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
            r"<meta[^>]+name=[\'\"]og:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]",
        ]:
            val = find(pat)
            if val:
                return urljoin(url, val)

        # Twitter card
        tw = find(r"<meta[^>]+name=[\'\"]twitter:image[\'\"][^>]+content=[\'\"]([^\'\"]+)[\'\"]")
        if tw:
            return urljoin(url, tw)

        # <link rel="image_src">
        link_img = find(r"<link[^>]+rel=[\'\"]image_src[\'\"][^>]+href=[\'\"]([^\'\"]+)[\'\"]")
        if link_img:
            return urljoin(url, link_img)

        # UC Davis directory profile images
        uc_img = find(r"<img[^>]+src=[\'\"]([^\'\"]*/styles/sf_profile/public/[^\'\"]+)[\'\"][^>]*>")
        if uc_img:
            return urljoin(url, uc_img)

        # srcset attribute
        srcset = find(r"<img[^>]+srcset=[\'\"]([^\'\"]+)[\'\"][^>]*>")
        if srcset:
            first = srcset.split(',')[0].strip().split()[0]
            if first:
                return urljoin(url, first)

        # Any <img src="...">
        img = find(r"<img[^>]+src=[\'\"]([^\'\"]+)[\'\"][^>]*>")
        if img:
            return urljoin(url, img)
    except Exception:
        pass
    return ""


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(here, "data", "professors.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0
    for obj in data:
        try:
            photo_url = (obj.get("photo_url") or "").strip()
            profile_link = (obj.get("profile_link") or "").strip()
            if (not photo_url) and profile_link:
                found = scrape_photo(profile_link)
                if found:
                    obj["photo_url"] = found
                    updated += 1
        except Exception:
            continue

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated {updated} photo_url entries in {json_path}")


if __name__ == "__main__":
    main()


