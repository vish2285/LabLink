import re
from typing import List, Dict, Any, Tuple
from datetime import datetime

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_OK = True
except Exception:
    SKLEARN_OK = False

_WS = re.compile(r"\s+")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")

SKILL_ALIASES = {
    "torch": "pytorch", "pytorch": "pytorch",
    "tf": "tensorflow", "tensorflow": "tensorflow",
    "opencv": "opencv",
    "cuda": "cuda", "nvidia-cuda": "cuda",
    "cpp": "c++", "c sharp": "c#", "postgres": "postgresql",
    "hpc": "high-performance computing",
    "pl": "programming languages"
}

def norm_text(s: str) -> str:
    return _WS.sub(" ", (s or "").strip()).lower()

def tokenize(s: str) -> List[str]:
    return [t for t in _NON_ALNUM.split(norm_text(s)) if t]

def normalize_skill(s: str) -> str:
    base = norm_text(s).replace(".", " ").strip()
    if base in SKILL_ALIASES: return SKILL_ALIASES[base]
    ns = base.replace(" ", "")
    return SKILL_ALIASES.get(ns, base)

def extract_skills(s: str) -> List[str]:
    if not s: return []
    parts = re.split(r"[;,]", s)
    skills = [normalize_skill(p.strip()) for p in parts if p.strip()]
    if not skills:
        skills = [normalize_skill(t) for t in tokenize(s)]
    seen, out = set(), []
    for k in skills:
        if k and k not in seen:
            seen.add(k); out.append(k)
    return out

def jaccard(a: List[str], b: List[str]) -> Tuple[float, List[str]]:
    A, B = {normalize_skill(x) for x in a}, {normalize_skill(x) for x in b}
    if not A or not B: return 0.0, []
    inter, union = A & B, A | B
    return len(inter)/len(union), sorted(list(inter))

def year_from_pub(d: Dict[str, Any]) -> int | None:
    try:
        return int(d.get("year")) if d.get("year") is not None else None
    except: return None

def prof_to_doc(p: Dict[str, Any]) -> str:
    parts = [p.get("research_interests", "")]
    for d in p.get("recent_publications", []):
        parts += [d.get("title") or "", d.get("abstract") or ""]
    if p.get("skills"):
        parts.append(" ".join(p["skills"]))
    return norm_text(" ".join(parts).strip())

class VectorStore:
    def __init__(self, prof_docs: List[str]):
        self.docs = prof_docs
        if SKLEARN_OK:
            self.vect = TfidfVectorizer(stop_words="english")
            self.mat = self.vect.fit_transform(self.docs)
        else:
            self.vect, self.mat = None, None

    def sims(self, q: str) -> List[float]:
        qn = norm_text(q)
        if SKLEARN_OK and self.vect is not None:
            qvec = self.vect.transform([qn])
            return [float(x) for x in cosine_similarity(qvec, self.mat)[0]]
        # fallback: Jaccard on tokens
        qtok = set(tokenize(qn))
        out = []
        for d in self.docs:
            dtok = set(tokenize(d))
            if not qtok or not dtok: out.append(0.0)
            else:
                out.append(len(qtok & dtok) / len(qtok | dtok))
        return out

def pubs_score(interests_tokens: List[str], pubs: List[Dict[str, Any]]) -> Tuple[float, List[str], float]:
    if not pubs or not interests_tokens: return 0.0, [], 1.0
    this_year = datetime.utcnow().year
    hits, total_hits, bonus = [], 0, 1.0
    for d in pubs:
        text = norm_text((d.get("title") or "") + " " + (d.get("abstract") or ""))
        local = False
        for kw in interests_tokens:
            if kw and kw in text:
                hits.append(kw); total_hits += 1; local = True
        if local:
            y = year_from_pub(d)
            if y is not None:
                age = this_year - y
                if age <= 3: bonus = max(bonus, 1.05)
                elif age <= 5: bonus = max(bonus, 1.02)
    base = min(total_hits, 3) / 3.0
    return base, sorted(list(set(hits))), bonus
