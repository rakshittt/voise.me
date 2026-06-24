"""Fetch a URL and extract readable text for voice DNA training.

Security: validates URL scheme and blocks private/loopback IP ranges.
Only http:// and https:// are allowed. Returns plain text ready for chunking.
"""
import ipaddress
import re
from urllib.parse import urlparse

import httpx

_TIMEOUT = 12  # seconds
_MAX_BYTES = 2 * 1024 * 1024  # 2 MB - enough for any article

# Tags whose content we discard entirely
_DISCARD_TAGS = re.compile(
    r"<(script|style|noscript|nav|header|footer|aside|figure|figcaption|"
    r"svg|iframe|form|button|select|textarea|input)[^>]*>.*?</\1>",
    re.DOTALL | re.IGNORECASE,
)
# Tags we extract text from
_CONTENT_TAGS = re.compile(
    r"<(?:p|h[1-6]|li|blockquote|td|dt|dd)[^>]*>(.*?)</(?:p|h[1-6]|li|blockquote|td|dt|dd)>",
    re.DOTALL | re.IGNORECASE,
)
_TITLE_TAG = re.compile(r"<title[^>]*>(.*?)</title>", re.DOTALL | re.IGNORECASE)
_ANY_TAG = re.compile(r"<[^>]+>")
_ENTITIES = {
    "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&quot;": '"', "&#39;": "'", "&mdash;": "-", "&ndash;": "–",
    "&hellip;": "…", "&rsquo;": "'", "&lsquo;": "'", "&rdquo;": '"', "&ldquo;": '"',
}


class UrlFetchError(Exception):
    pass


def _validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UrlFetchError("Only http:// and https:// URLs are supported.")
    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise UrlFetchError("Invalid URL - no hostname found.")
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast:
            raise UrlFetchError("Private or internal URLs are not allowed.")
    except ValueError:
        pass  # Domain name - fine
    return url


def _extract_title(html: str) -> str:
    m = _TITLE_TAG.search(html)
    if not m:
        return ""
    raw = _ANY_TAG.sub("", m.group(1))
    return _decode_entities(raw).strip()[:200]


def _decode_entities(text: str) -> str:
    for entity, char in _ENTITIES.items():
        text = text.replace(entity, char)
    return re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)


def _extract_text(html: str) -> str:
    # Remove discard-tag blocks first
    html = _DISCARD_TAGS.sub(" ", html)

    # Extract text from content-bearing tags
    paragraphs = _CONTENT_TAGS.findall(html)
    if len(paragraphs) >= 3:
        text = "\n\n".join(paragraphs)
    else:
        # Fallback: strip all tags from whatever remains
        text = html

    text = _ANY_TAG.sub(" ", text)
    text = _decode_entities(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def fetch_url(url: str) -> tuple[str, str]:
    """Fetch a public URL and return (plain_text, page_title).

    Raises UrlFetchError on invalid URLs, non-200 responses, or network errors.
    """
    url = _validate_url(url)
    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; Voise/1.0)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            # Read up to MAX_BYTES
            html = resp.text[:_MAX_BYTES]
    except httpx.HTTPStatusError as e:
        raise UrlFetchError(f"URL returned {e.response.status_code}.") from e
    except httpx.TimeoutException:
        raise UrlFetchError("Request timed out - the URL took too long to respond.")
    except Exception as e:
        raise UrlFetchError(f"Could not fetch URL: {e}") from e

    title = _extract_title(html)
    text = _extract_text(html)

    if len(text.split()) < 50:
        raise UrlFetchError(
            "Could not extract readable text from this URL. "
            "Try copying and pasting the article text directly instead."
        )

    return text, title
