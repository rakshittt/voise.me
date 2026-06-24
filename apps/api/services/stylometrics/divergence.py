"""Divergence metrics for stylometric voice-match scoring."""
import math


def _kl(p: dict[str, float], q: dict[str, float]) -> float:
    """KL(P ‖ Q) with epsilon smoothing for missing Q entries."""
    eps = 1e-10
    total = 0.0
    for tag, pv in p.items():
        if pv <= 0:
            continue
        qv = q.get(tag, eps)
        total += pv * math.log2(pv / max(qv, eps))
    return total


def js_divergence(p: dict[str, float], q: dict[str, float]) -> float:
    """Jensen-Shannon divergence in [0, 1] (log₂ base).

    0.0 = identical distributions, 1.0 = fully disjoint.
    """
    if not p or not q:
        return 0.5
    all_tags = set(p) | set(q)
    m = {tag: (p.get(tag, 0.0) + q.get(tag, 0.0)) / 2.0 for tag in all_tags}
    return (_kl(p, m) + _kl(q, m)) / 2.0


def mtld_delta_score(post_mtld: float, profile_mean: float, profile_std: float) -> float:
    """How close the post's MTLD is to the author's typical range. Returns 0–1.

    Uses a 3-sigma window: z=0 → 1.0, z=3 → 0.0.
    """
    if profile_std <= 0:
        return 1.0 if abs(post_mtld - profile_mean) < 5 else 0.5
    z = abs(post_mtld - profile_mean) / profile_std
    return max(0.0, 1.0 - z / 3.0)


def pos_jsd_score(post_pos: dict[str, float], profile_pos: dict[str, float]) -> float:
    """Syntactic similarity via POS Jensen-Shannon divergence. Returns 0–1.

    Higher = more similar POS fingerprint to the author's corpus.
    """
    if not post_pos or not profile_pos:
        return 0.5
    return max(0.0, 1.0 - js_divergence(post_pos, profile_pos))
