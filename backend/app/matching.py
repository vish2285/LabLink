import re
from typing import List, Dict, Any, Tuple
from datetime import datetime
from rank_bm25 import BM25Okapi
import os

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_OK = True
except Exception:
    SKLEARN_OK = False

# Optional semantic embeddings (graceful fallback if not installed)
# Lazy import gates to avoid loading torch/transformers on low-memory deploys
SentenceTransformer = None  # type: ignore
CrossEncoder = None  # type: ignore
_np = None  # type: ignore
SEM_OK = False
_LAZY_IMPORTED = False

def _lazy_import_st():
    global SentenceTransformer, CrossEncoder, _np, SEM_OK, _LAZY_IMPORTED
    if _LAZY_IMPORTED:
        return
    try:
        from sentence_transformers import SentenceTransformer as _ST  # type: ignore
        from sentence_transformers import CrossEncoder as _CE  # type: ignore
        import numpy as _NP  # type: ignore
        SentenceTransformer = _ST  # type: ignore
        CrossEncoder = _CE  # type: ignore
        _np = _NP  # type: ignore
        SEM_OK = True
    except Exception:
        SentenceTransformer = None  # type: ignore
        CrossEncoder = None  # type: ignore
        _np = None  # type: ignore
        SEM_OK = False
    finally:
        _LAZY_IMPORTED = True

_WS = re.compile(r"\s+")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")

from .aliases import SKILL_ALIASES, INTEREST_ALIASES

# INTEREST_ALIASES is imported from .aliases

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
    # Publications removed; keep stub for compatibility
    return None

def prof_to_doc(p: Dict[str, Any]) -> str:
    parts = [p.get("research_interests", "")]
    if p.get("skills"):
        parts.append(" ".join(p["skills"]))
    return norm_text(" ".join(parts).strip())

def _normalize_interest_phrase(s: str) -> str:
    return norm_text(s)

def expand_query_text(interests: str, skills: str | None) -> str:
    """Expand a user's query with conservative synonyms to improve lexical recall.

    This does not modify stored documents; it only augments the query string fed to
    the lexical vector store (TF-IDF/BM25) to help with common abbreviations.
    """
    base_parts: List[str] = [interests or ""]
    if skills:
        base_parts.append(skills)

    expansions: List[str] = []
    # Expand interest phrases by comma/semicolon to preserve multi-word units
    for raw in re.split(r"[,;]", interests or ""):
        phrase = _normalize_interest_phrase(raw)
        if not phrase:
            continue
        # Exact phrase expansions
        for x in INTEREST_ALIASES.get(phrase, []):
            expansions.append(x)
        # Also expand token-level abbreviations present in the phrase
        for tok in tokenize(phrase):
            for x in INTEREST_ALIASES.get(tok, []):
                expansions.append(x)

    # Expand skills via existing SKILL_ALIASES mapping
    if skills:
        for raw in re.split(r"[;,]", skills):
            k = norm_text(raw).strip()
            if not k:
                continue
            # Add alias if available
            alias = SKILL_ALIASES.get(k) or SKILL_ALIASES.get(k.replace(" ", ""))
            if alias and alias != k:
                expansions.append(alias)

    # Construct expanded query string
    full = " ".join([p for p in base_parts if p] + expansions)
    return norm_text(full)

class VectorStore:
    def __init__(self, prof_docs: List[str]):
        # Normalize and drop empty documents to avoid sklearn empty vocabulary errors
        cleaned_docs = [norm_text(d) for d in (prof_docs or []) if (d or "").strip()]
        self.docs = cleaned_docs
        # tokenized corpus for BM25
        self._bm25_tokens: List[List[str]] = [tokenize(d) for d in self.docs]
        self._bm25 = BM25Okapi(self._bm25_tokens) if self._bm25_tokens else None
        if SKLEARN_OK and self.docs:
            try:
                self.vect = TfidfVectorizer(stop_words="english")
                self.mat = self.vect.fit_transform(self.docs)
            except ValueError:
                # Fallback gracefully when vocabulary is empty
                self.vect, self.mat = None, None
        else:
            self.vect, self.mat = None, None

    def sims(self, q: str) -> List[float]:
        qn = norm_text(q)
        # TF-IDF cosine (if available)
        tfidf_scores: List[float] | None = None
        if SKLEARN_OK and self.vect is not None:
            qvec = self.vect.transform([qn])
            tfidf_scores = [float(x) for x in cosine_similarity(qvec, self.mat)[0]]

        # BM25 lexical score (normalized)
        bm25_scores: List[float] | None = None
        if self._bm25 is not None:
            q_tokens = tokenize(qn)
            raw = self._bm25.get_scores(q_tokens)
            mx = max(1e-9, max(raw) if len(raw) else 1.0)
            bm25_scores = [float(x) / mx for x in raw]

        # Coverage fallback
        cov_scores: List[float] | None = None
        if tfidf_scores is None and bm25_scores is None:
            qtok = set(tokenize(qn))
            out = []
            for d in self.docs:
                dtok = set(tokenize(d))
                if not qtok or not dtok:
                    out.append(0.0)
                else:
                    out.append(len(qtok & dtok) / max(1, len(qtok)))
            cov_scores = out

        # Blend available signals: TF-IDF 0.6, BM25 0.4; else fallback
        if tfidf_scores is not None and bm25_scores is not None:
            return [0.6 * a + 0.4 * b for a, b in zip(tfidf_scores, bm25_scores)]
        if tfidf_scores is not None:
            return tfidf_scores
        if bm25_scores is not None:
            return bm25_scores
        return cov_scores or []


class SemanticIndex:
    """Lightweight wrapper around sentence-transformers for semantic similarity.

    If dependencies are not available, this degrades to a no-op returning zeros.
    """
    def __init__(self, prof_docs: List[str]):
        # Only enable if explicitly enabled via env; import heavy deps lazily
        env_enabled = str(os.getenv("SEMANTIC_ENABLED", "0")).lower() in {"1", "true", "yes"}
        if not (env_enabled and prof_docs):
            self.enabled = False
            self.docs = [norm_text(d) for d in (prof_docs or []) if (d or "").strip()]
            self._model = None
            self._emb = None
            return
        _lazy_import_st()
        self.enabled = bool(SEM_OK and prof_docs)
        self.docs = [norm_text(d) for d in (prof_docs or []) if (d or "").strip()]
        self._model = None
        self._emb = None
        if self.enabled:
            try:
                # Allow overriding model; default to a small footprint
                model_name = os.getenv("SEMANTIC_MODEL", "sentence-transformers/paraphrase-MiniLM-L3-v2")
                self._model = SentenceTransformer(model_name)  # type: ignore
                emb = self._model.encode(self.docs, normalize_embeddings=True, convert_to_numpy=True)  # type: ignore
                # Ensure float32, finite values, and re-normalize to avoid numeric issues
                emb32 = emb.astype("float32")  # type: ignore
                emb32 = _np.nan_to_num(emb32, nan=0.0, posinf=0.0, neginf=0.0)  # type: ignore
                norms = _np.linalg.norm(emb32, axis=1, keepdims=True)  # type: ignore
                safe_norms = _np.where(_np.isfinite(norms) & (norms > 1e-12), norms, 1.0)  # type: ignore
                emb32 = emb32 / safe_norms  # type: ignore
                # Ensure contiguous
                self._emb = _np.ascontiguousarray(emb32)  # type: ignore
            except Exception:
                # Disable on any runtime error
                self.enabled = False
                self._model = None
                self._emb = None

    def sims(self, q: str) -> List[float]:
        if not self.enabled or self._model is None or self._emb is None:
            return [0.0 for _ in self.docs]
        try:
            qv = self._model.encode([norm_text(q)], normalize_embeddings=True, convert_to_numpy=True)  # type: ignore
            qv32 = qv.astype("float32")  # type: ignore
            # Sanitize and re-normalize query vector
            qv32 = _np.nan_to_num(qv32, nan=0.0, posinf=0.0, neginf=0.0)  # type: ignore
            qn = _np.linalg.norm(qv32)  # type: ignore
            if not _np.isfinite(qn) or qn <= 1e-12:  # type: ignore
                qv32[:] = 0.0  # type: ignore
            else:
                qv32 = qv32 / qn  # type: ignore
            # Cosine similarity is dot product when vectors are L2-normalized
            sims = (qv32 @ self._emb.T)[0]  # type: ignore
            # Convert to native Python floats and clamp to [0,1]
            out = []
            for x in _np.nan_to_num(sims, nan=0.0, posinf=0.0, neginf=0.0).tolist():  # type: ignore
                # cosine may be slightly outside bounds due to numeric error
                y = max(0.0, min(1.0, float(x)))
                out.append(y)
            return out
        except Exception:
            return [0.0 for _ in self.docs]


class CrossEncoderReranker:
    """Optional cross-encoder reranker for top-K pairs. Safe fallback if deps missing.

    Enabled only when sentence-transformers is available AND env SEMANTIC_RERANK_ENABLED is truthy.
    """

    def __init__(self, model_name: str | None = None):
        self.available = False
        self.model = None
        try:
            enabled = str(os.getenv("SEMANTIC_RERANK_ENABLED", "0")).lower() in {"1", "true", "yes"}
            if not enabled:
                return
            _lazy_import_st()
            if CrossEncoder is None:
                return
            name = model_name or os.getenv("SEMANTIC_RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
            self.model = CrossEncoder(name)  # type: ignore
            self.available = True
        except Exception:
            self.model = None
            self.available = False

    def score(self, query: str, docs: list[str]) -> list[float]:
        if not self.available or not self.model or not docs:
            return [0.0 for _ in docs]
        try:
            pairs = [(query, d) for d in docs]
            scores = self.model.predict(pairs)  # type: ignore
            # Normalize to [0,1]
            if hasattr(scores, "tolist"):
                scores = scores.tolist()
            vals = [float(x) for x in scores]
            # Min-max normalize defensively
            mn, mx = (min(vals), max(vals)) if vals else (0.0, 1.0)
            rng = (mx - mn) if (mx - mn) > 1e-9 else 1.0
            return [max(0.0, min(1.0, (v - mn) / rng)) for v in vals]
        except Exception:
            return [0.0 for _ in docs]

def pubs_score(interests_tokens: List[str], pubs: List[Dict[str, Any]]) -> Tuple[float, List[str], float]:
    # Publications removed; always return zeros/neutral
    return 0.0, [], 1.0
