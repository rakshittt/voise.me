"""Parse LinkedIn GDPR data export (ZIP or CSV) into plain post strings.

LinkedIn's data export produces a ZIP containing many CSV files.
The posts file is typically named 'Shares.csv'. Its key column is
'ShareCommentary' - the user's own words. Pure reshares have an empty
ShareCommentary and are silently dropped.

Column names vary slightly across export regions/dates, so we probe a
priority list before falling back to any column whose name contains
'commentary' or 'share'.
"""
import csv
import io
import logging
import zipfile

logger = logging.getLogger(__name__)

# Priority order for the column that holds the post body
_TEXT_COLUMN_CANDIDATES = [
    "ShareCommentary",
    "Share Commentary",
    "sharecommentary",
    "share_commentary",
    "Post Text",
    "PostText",
    "body",
    "text",
]

# File names inside the ZIP that are likely to contain post data
_SHARES_FILE_CANDIDATES = [
    "Shares.csv",
    "shares.csv",
    "Posts.csv",
    "posts.csv",
]

# Files that indicate the user uploaded the wrong selective export
_ARTICLES_ONLY_FILES = {
    "Articles.csv",
    "articles.csv",
}


class LinkedInParseError(ValueError):
    """Raised when the uploaded file can't be parsed as a LinkedIn export."""


def _find_text_column(fieldnames: list[str]) -> str | None:
    for candidate in _TEXT_COLUMN_CANDIDATES:
        if candidate in fieldnames:
            return candidate
    # Fuzzy fallback: any field containing "commentary"
    for f in fieldnames:
        if "commentary" in f.lower():
            return f
    return None


def _parse_csv(csv_text: str, min_words: int) -> list[str]:
    # Strip BOM that some LinkedIn exports include
    csv_text = csv_text.lstrip("﻿")
    reader = csv.DictReader(io.StringIO(csv_text))

    if not reader.fieldnames:
        raise LinkedInParseError("The CSV file appears to be empty or has no headers.")

    text_col = _find_text_column(list(reader.fieldnames))
    if text_col is None:
        visible = ", ".join(reader.fieldnames[:8])
        raise LinkedInParseError(
            f"Could not find a post-text column. Columns found: {visible}. "
            "Make sure you uploaded the 'Download larger data archive' ZIP "
            "(the first option on LinkedIn's Download my data page)."
        )

    posts: list[str] = []
    for row in reader:
        raw = (row.get(text_col) or "").strip()
        if not raw:
            continue  # Pure reshare - no original commentary
        if len(raw.split()) >= min_words:
            posts.append(raw)

    return posts


def _extract_csv_from_zip(content: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            # Flatten to basenames so we match regardless of subdirectory
            names = z.namelist()
            basenames = {n.rsplit("/", 1)[-1]: n for n in names}

            # Detect wrong export: only Articles.csv present, no Shares.csv
            has_articles = any(b in _ARTICLES_ONLY_FILES for b in basenames)
            has_shares = any(b in set(_SHARES_FILE_CANDIDATES) for b in basenames)
            if has_articles and not has_shares:
                raise LinkedInParseError(
                    "This ZIP contains Articles data, but not your posts.\n\n"
                    "LinkedIn removed 'Posts' from the selective export. To get your posts:\n"
                    "1. Go to Settings → Data Privacy → Download my data\n"
                    "2. Select the FIRST option: 'Download larger data archive'\n"
                    "3. Click 'Request archive' - LinkedIn will email you a link (a few hours).\n\n"
                    "Alternatively, use 'Paste writing' to paste your posts directly."
                )

            # Try known Shares/Posts file names (with and without subdirectory)
            target = next(
                (basenames[b] for b in _SHARES_FILE_CANDIDATES if b in basenames),
                None,
            )

            # Fuzzy fallback: any CSV with 'share' or 'post' in the name
            if target is None:
                target = next(
                    (n for n in names if n.lower().endswith(".csv") and ("share" in n.lower() or "post" in n.lower())),
                    None,
                )

            # Last resort: any CSV
            if target is None:
                target = next((n for n in names if n.lower().endswith(".csv")), None)

            if target is None:
                csv_count = sum(1 for n in names if n.lower().endswith(".csv"))
                raise LinkedInParseError(
                    f"No post data found in the ZIP ({csv_count} CSV files present, none contain posts). "
                    "Make sure you selected 'Download larger data archive' (the first option), "
                    "not the individual file checkboxes."
                )

            logger.info(f"Parsing LinkedIn export file: {target}")
            with z.open(target) as f:
                return f.read().decode("utf-8", errors="replace")

    except zipfile.BadZipFile as e:
        raise LinkedInParseError("The file does not appear to be a valid ZIP archive.") from e


def parse_linkedin_export(content: bytes, filename: str, min_words: int = 30) -> list[str]:
    """Parse a LinkedIn data export (ZIP or CSV) and return post strings.

    Args:
        content: Raw file bytes from the uploaded file.
        filename: Original filename, used to detect file type.
        min_words: Minimum word count for a post to be included.

    Returns:
        List of post strings (user's own words only, no reshares).

    Raises:
        LinkedInParseError: If the file cannot be parsed.
    """
    lower = filename.lower()

    if lower.endswith(".zip") or content[:4] == b"PK\x03\x04":
        csv_text = _extract_csv_from_zip(content)
    elif lower.endswith(".csv"):
        csv_text = content.decode("utf-8", errors="replace")
    else:
        raise LinkedInParseError(
            "Unsupported file type. Please upload the ZIP file from your LinkedIn data export, "
            "or the Shares.csv file directly."
        )

    posts = _parse_csv(csv_text, min_words)

    if not posts:
        raise LinkedInParseError(
            "No posts with at least 30 words were found in the export. "
            "Make sure the file comes from 'Download larger data archive' "
            "and that you have published original posts (not just reshares)."
        )

    logger.info(f"Parsed {len(posts)} posts from LinkedIn export ({filename})")
    return posts
