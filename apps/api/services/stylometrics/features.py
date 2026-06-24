"""Deterministic stylometric feature extraction.

Computes MTLD (bidirectional lexical diversity) and POS tag distributions.
Falls back to regex-based POS approximation when spaCy model is unavailable.
"""
import logging
import re
import threading
from statistics import mean, stdev

logger = logging.getLogger(__name__)

# ── Tokenisation ──────────────────────────────────────────────────────────────

_WORD_RE = re.compile(r"[a-zA-Z']+")

def _tokenize(text: str) -> list[str]:
    return [w.lower() for w in _WORD_RE.findall(text)]


# ── MTLD (bidirectional) ──────────────────────────────────────────────────────

_MTLD_THRESHOLD = 0.72


def _mtld_pass(tokens: list[str]) -> float:
    """One-direction MTLD pass. Returns tokens-per-factor (higher = more diverse)."""
    n = len(tokens)
    if n == 0:
        return 0.0

    types: set[str] = set()
    token_count = 0
    factor_count = 0.0

    for token in tokens:
        types.add(token)
        token_count += 1
        ttr = len(types) / token_count
        if ttr <= _MTLD_THRESHOLD:
            factor_count += 1.0
            types = set()
            token_count = 0

    if token_count > 0:
        final_ttr = len(types) / token_count
        partial = (1.0 - final_ttr) / (1.0 - _MTLD_THRESHOLD)
        factor_count += partial

    return n / factor_count if factor_count > 0 else float(n)


def compute_mtld(text: str) -> float:
    """Bidirectional MTLD score. Higher = more lexically diverse."""
    tokens = _tokenize(text)
    if len(tokens) < 10:
        return 50.0
    forward = _mtld_pass(tokens)
    backward = _mtld_pass(list(reversed(tokens)))
    return (forward + backward) / 2.0


def compute_corpus_mtld_stats(posts: list[str]) -> dict:
    """Mean and std of MTLD across a corpus of posts."""
    scores = [compute_mtld(p) for p in posts if p.strip()]
    if not scores:
        return {"mtld_mean": 50.0, "mtld_std": 10.0}
    m = mean(scores)
    s = stdev(scores) if len(scores) > 1 else 10.0
    return {"mtld_mean": m, "mtld_std": max(s, 1.0)}


# ── POS distributions ─────────────────────────────────────────────────────────

_spacy_nlp = None
_spacy_available: bool | None = None
_spacy_lock = threading.Lock()


def _get_spacy_nlp():
    global _spacy_nlp, _spacy_available
    if _spacy_available is False:
        raise ImportError("spaCy model unavailable")
    if _spacy_nlp is not None:
        return _spacy_nlp
    with _spacy_lock:
        if _spacy_nlp is not None:
            return _spacy_nlp
        try:
            import spacy
            _spacy_nlp = spacy.load("en_core_web_sm")
            _spacy_available = True
            logger.info("Loaded spaCy en_core_web_sm for POS tagging")
        except Exception as exc:
            _spacy_available = False
            logger.info("spaCy unavailable (%s) - using regex POS fallback", exc)
            raise ImportError("spaCy model unavailable") from exc
    return _spacy_nlp


def _pos_distribution_spacy(text: str) -> dict[str, float]:
    nlp = _get_spacy_nlp()
    doc = nlp(text[:4000])
    counts: dict[str, int] = {}
    total = 0
    for token in doc:
        if not token.is_space:
            counts[token.pos_] = counts.get(token.pos_, 0) + 1
            total += 1
    if total == 0:
        return {}
    return {k: v / total for k, v in counts.items()}


_RE_AUX = re.compile(
    r"\b(?:is|are|was|were|have|has|had|do|does|did|will|would|can|could|"
    r"should|may|might|must|shall)\b",
    re.IGNORECASE,
)
_RE_PUNCT_CHR = re.compile(r"[.,!?;:-–]")
_RE_NUMBER_TOK = re.compile(r"\b\d+[\.,]?\d*\b")


def _pos_distribution_regex(text: str) -> dict[str, float]:
    """Rough heuristic POS distribution. Used only when spaCy is unavailable."""
    words = _WORD_RE.findall(text)
    total = len(words)
    if total == 0:
        return {}

    aux = len(_RE_AUX.findall(text))
    punct = len(_RE_PUNCT_CHR.findall(text))
    nums = len(_RE_NUMBER_TOK.findall(text))

    aux_r = aux / total
    punct_r = punct / max(total, 1)
    num_r = nums / max(total, 1)
    noun_r = max(0.0, 0.35 - aux_r * 0.3)
    verb_r = max(0.0, 0.18 + aux_r * 0.2)
    adj_r = 0.12
    adv_r = 0.07
    other_r = max(0.0, 1.0 - noun_r - verb_r - adj_r - adv_r - aux_r)

    raw = {
        "NOUN": noun_r, "VERB": verb_r, "AUX": aux_r,
        "ADJ": adj_r, "ADV": adv_r, "PUNCT": punct_r,
        "NUM": num_r, "OTHER": other_r,
    }
    total_w = sum(raw.values())
    if total_w <= 0:
        return raw
    return {k: v / total_w for k, v in raw.items()}


def compute_pos_distribution(text: str) -> dict[str, float]:
    """Compute POS distribution. Prefers spaCy, falls back to regex."""
    try:
        return _pos_distribution_spacy(text)
    except Exception:
        return _pos_distribution_regex(text)


def compute_corpus_pos_distribution(posts: list[str]) -> dict[str, float]:
    """Mean POS distribution across a corpus, normalised to sum to 1."""
    distributions = [compute_pos_distribution(p) for p in posts if p.strip()]
    if not distributions:
        return {}

    all_tags: set[str] = set()
    for d in distributions:
        all_tags.update(d.keys())

    result: dict[str, float] = {}
    for tag in all_tags:
        result[tag] = mean(d.get(tag, 0.0) for d in distributions)

    total = sum(result.values())
    if total > 0:
        result = {k: v / total for k, v in result.items()}
    return result


# ── Public API ─────────────────────────────────────────────────────────────────

def compute_stylometric_profile(posts: list[str]) -> dict:
    """Build stylometric fingerprint from a corpus.

    Returns a dict with mtld_mean, mtld_std, and pos_distribution.
    Intended to be called in a thread (CPU-bound).
    """
    mtld_stats = compute_corpus_mtld_stats(posts)
    pos_dist = compute_corpus_pos_distribution(posts)
    return {**mtld_stats, "pos_distribution": pos_dist}
