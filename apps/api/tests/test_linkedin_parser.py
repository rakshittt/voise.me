import io
import zipfile

import pytest

from services.voice_dna.linkedin_parser import LinkedInParseError, parse_linkedin_export


def _make_csv(rows: list[dict], fieldnames: list[str] | None = None) -> bytes:
    import csv
    buf = io.StringIO()
    fields = fieldnames or list(rows[0].keys()) if rows else ["ShareCommentary"]
    writer = csv.DictWriter(buf, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode()


def _long_text(word_count: int = 40) -> str:
    return ("word " * word_count).strip()


def _make_zip(csv_bytes: bytes, filename: str = "Shares.csv") -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(filename, csv_bytes)
    return buf.getvalue()


# ── CSV parsing ────────────────────────────────────────────────────────────────

def test_parses_standard_csv():
    rows = [{"ShareCommentary": _long_text(40), "Date": "2024-01-01"}]
    result = parse_linkedin_export(_make_csv(rows), "Shares.csv")
    assert len(result) == 1
    assert "word" in result[0]


def test_strips_reshares_with_empty_commentary():
    rows = [
        {"ShareCommentary": _long_text(40)},
        {"ShareCommentary": ""},        # reshare - empty commentary
        {"ShareCommentary": "   "},     # whitespace only
    ]
    result = parse_linkedin_export(_make_csv(rows), "shares.csv")
    assert len(result) == 1


def test_filters_posts_under_min_words():
    rows = [
        {"ShareCommentary": "Too short."},
        {"ShareCommentary": _long_text(40)},
    ]
    result = parse_linkedin_export(_make_csv(rows), "shares.csv")
    assert len(result) == 1


def test_handles_bom_prefix():
    csv_bytes = b"\xef\xbb\xbf" + _make_csv([{"ShareCommentary": _long_text(35)}])
    result = parse_linkedin_export(csv_bytes, "shares.csv")
    assert len(result) == 1


def test_fuzzy_column_name_with_space():
    rows = [{"Share Commentary": _long_text(35), "Date": "2024-01-01"}]
    import csv
    import io
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["Share Commentary", "Date"])
    writer.writeheader()
    writer.writerows(rows)
    result = parse_linkedin_export(buf.getvalue().encode(), "shares.csv")
    assert len(result) == 1


def test_raises_on_no_text_column():
    rows = [{"Date": "2024-01-01", "MediaUrl": "http://example.com"}]
    with pytest.raises(LinkedInParseError, match="post-text column"):
        parse_linkedin_export(_make_csv(rows), "shares.csv")


def test_raises_when_all_posts_too_short():
    rows = [{"ShareCommentary": "Hi."}, {"ShareCommentary": "Hello world."}]
    with pytest.raises(LinkedInParseError, match="No posts"):
        parse_linkedin_export(_make_csv(rows), "shares.csv")


# ── ZIP parsing ────────────────────────────────────────────────────────────────

def test_parses_zip_with_shares_csv():
    csv_bytes = _make_csv([{"ShareCommentary": _long_text(40)}])
    result = parse_linkedin_export(_make_zip(csv_bytes, "Shares.csv"), "export.zip")
    assert len(result) == 1


def test_parses_zip_lowercase_shares():
    csv_bytes = _make_csv([{"ShareCommentary": _long_text(40)}])
    result = parse_linkedin_export(_make_zip(csv_bytes, "shares.csv"), "export.zip")
    assert len(result) == 1


def test_parses_zip_by_magic_bytes():
    csv_bytes = _make_csv([{"ShareCommentary": _long_text(40)}])
    zip_bytes = _make_zip(csv_bytes, "Shares.csv")
    # Pass with a .bin extension - detection must fall back to magic bytes
    result = parse_linkedin_export(zip_bytes, "download.bin")
    assert len(result) == 1


def test_raises_on_bad_zip():
    with pytest.raises(LinkedInParseError, match="valid ZIP"):
        parse_linkedin_export(b"not a zip file at all", "export.zip")


def test_raises_on_unsupported_extension():
    with pytest.raises(LinkedInParseError, match="Unsupported file type"):
        parse_linkedin_export(b"data", "export.pdf")


def test_multiple_posts_all_parsed():
    rows = [{"ShareCommentary": _long_text(35 + i)} for i in range(5)]
    result = parse_linkedin_export(_make_csv(rows), "Shares.csv")
    assert len(result) == 5
