"""Chunk large text sources into post-sized segments for voice DNA training.

Handles blog posts, newsletters, transcripts, and any pasted writing.
Produces segments of 30–300 words that the voice profile builder can ingest.
"""
import re

TARGET_WORDS = 120   # ideal chunk size
MIN_WORDS = 30       # reject below this
MAX_WORDS = 300      # force-split above this

# Matches transcript speaker labels at the start of a line:
# "John:", "[Host]:", "Q:", "Speaker 1:", etc.
_SPEAKER_RE = re.compile(r"^\s*(?:\[?[A-Za-z][A-Za-z0-9 ]{0,28}\]?):\s*", re.MULTILINE)
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def chunk_text(text: str, source_type: str = "text") -> list[str]:
    """Split text into voice-DNA-ready segments.

    source_type:
        "text"       - generic writing (blogs, newsletters, articles, tweets)
        "transcript" - speaker-turn detection before paragraph splitting
    """
    if source_type == "transcript":
        return _chunk_transcript(text)
    return _chunk_generic(text)


def _chunk_generic(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Hard separators take priority
    if re.search(r"\n---+\n", text):
        sections = re.split(r"\n---+\n", text)
    elif re.search(r"\n{3,}", text):
        sections = re.split(r"\n{3,}", text)
    else:
        sections = [text]

    raw: list[str] = []
    for section in sections:
        # Split by double newlines (paragraphs/stanzas)
        paras = [p.strip() for p in re.split(r"\n\n+", section) if p.strip()]
        raw.extend(paras)

    return _normalize(raw)


def _chunk_transcript(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Detect speaker turns - split on any line that starts with "Name: "
    matches = list(_SPEAKER_RE.finditer(text))
    if len(matches) >= 3:
        turns: list[str] = []
        for i, m in enumerate(matches):
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            # Strip the speaker label; keep only the spoken content
            content = text[m.end(): end].strip()
            if content:
                turns.append(content)
        if len(turns) >= 5:
            return _normalize(turns)

    # Fallback: treat as generic text
    return _chunk_generic(text)


def _normalize(raw: list[str]) -> list[str]:
    """Force-split long chunks; merge short ones; filter below MIN_WORDS."""
    # Pass 1: split anything over MAX_WORDS at sentence boundaries
    expanded: list[str] = []
    for chunk in raw:
        chunk = re.sub(r"\s+", " ", chunk).strip()
        if not chunk:
            continue
        if len(chunk.split()) > MAX_WORDS:
            expanded.extend(_split_sentences(chunk))
        else:
            expanded.append(chunk)

    # Pass 2: merge consecutive chunks that are too short
    merged: list[str] = []
    buf = ""
    for chunk in expanded:
        if not chunk:
            continue
        if buf:
            candidate = buf + " " + chunk
            if len(candidate.split()) <= int(TARGET_WORDS * 1.6):
                buf = candidate
                continue
            else:
                if len(buf.split()) >= MIN_WORDS:
                    merged.append(buf)
                buf = chunk
        else:
            if len(chunk.split()) < MIN_WORDS:
                buf = chunk
            else:
                merged.append(chunk)

    if buf and len(buf.split()) >= MIN_WORDS:
        merged.append(buf)

    return merged


def _split_sentences(text: str, target: int = TARGET_WORDS) -> list[str]:
    """Split long text at sentence boundaries, targeting ~target words per chunk."""
    sentences = [s.strip() for s in _SENTENCE_END.split(text) if s.strip()]
    chunks: list[str] = []
    current: list[str] = []
    word_count = 0

    for sent in sentences:
        wc = len(sent.split())
        if word_count + wc > target and current:
            chunk = " ".join(current)
            if len(chunk.split()) >= MIN_WORDS:
                chunks.append(chunk)
            current = [sent]
            word_count = wc
        else:
            current.append(sent)
            word_count += wc

    if current:
        chunk = " ".join(current)
        if len(chunk.split()) >= MIN_WORDS:
            chunks.append(chunk)

    return chunks or [text]
