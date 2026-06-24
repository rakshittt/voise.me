"""Signature vocabulary presence scoring."""


def signature_vocab_score(post: str, signature_phrases: list[str]) -> float:
    """Score presence of author-signature phrases in a generated post.

    Returns 0–1. Defaults to 0.3 when none are found (neutral - signature
    phrases are rare by definition, so absence in a single post is expected).
    Scales to 1.0 when 3+ phrases are present.
    """
    if not signature_phrases:
        return 0.5

    post_lower = post.lower()
    present = sum(1 for phrase in signature_phrases if phrase.lower() in post_lower)

    if present == 0:
        return 0.3

    threshold = max(3, len(signature_phrases) // 2)
    return min(1.0, 0.3 + 0.7 * (present / threshold))
