"""Extract readable text from a PDF file for Voice DNA training."""
import io
import logging

from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)

MAX_PAGES = 150


def extract_pdf_text(pdf_bytes: bytes) -> tuple[str, int]:
    """Return (extracted_text, page_count) from raw PDF bytes.

    Raises ValueError if the PDF cannot be read or contains no extractable text.
    Scanned-image-only PDFs will return an empty string - the caller should
    surface a user-friendly message in that case.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except PdfReadError as e:
        raise ValueError(f"Could not open PDF: {e}") from e

    page_count = len(reader.pages)
    pages_to_read = min(page_count, MAX_PAGES)

    parts: list[str] = []
    for page in reader.pages[:pages_to_read]:
        try:
            text = page.extract_text() or ""
        except Exception:
            continue
        stripped = text.strip()
        if stripped:
            parts.append(stripped)

    if page_count > MAX_PAGES:
        logger.info("PDF has %d pages; only read first %d", page_count, MAX_PAGES)

    return "\n\n".join(parts), page_count
