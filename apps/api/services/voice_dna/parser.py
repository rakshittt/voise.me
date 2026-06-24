import re


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&quot;", '"', text)
    return text


def _word_count(text: str) -> int:
    return len(text.split())


def parse_posts(raw_text: str, min_words: int = 30) -> list[str]:
    """Parse a raw text blob into individual post strings.

    Priority: split on explicit '---' separators (used by card-based input).
    Fallback: split on 2+ blank lines (used by LinkedIn export paste).
    Strips HTML tags. Rejects posts under min_words words.
    """
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # If the text contains --- separators, use those exclusively so that
    # blank lines within a post (paragraph breaks) are not treated as boundaries.
    if re.search(r"\n---+\n", text):
        parts = re.split(r"\n---+\n", text)
    else:
        # Fallback for raw export pastes: split on 2+ blank lines
        parts = re.split(r"\n{2,}", text)

    posts: list[str] = []
    for part in parts:
        cleaned = _strip_html(part).strip()
        cleaned = re.sub(r" {2,}", " ", cleaned)
        if cleaned and _word_count(cleaned) >= min_words:
            posts.append(cleaned)

    return posts
