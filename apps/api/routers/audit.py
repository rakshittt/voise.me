import asyncio
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from services.voice_dna.extractor import (
    extract_hook_distribution,
    extract_structural_pattern,
    extract_vocabulary_register,
)
from services.voice_dna.parser import parse_posts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditRequest(BaseModel):
    posts: str = Field(..., min_length=50)


class AuditResponse(BaseModel):
    hook_distribution: dict
    structural_pattern: dict
    vocabulary_register: dict
    post_count: int


@router.post("", response_model=AuditResponse)
async def audit_posts(request: AuditRequest) -> AuditResponse:
    """Public endpoint - no auth required. Analyzes 3 voice dimensions."""
    posts = parse_posts(request.posts, min_words=30)

    if len(posts) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least 3 valid posts required (30+ words each). Found {len(posts)}.",
        )

    # Cap to 10 posts for the free audit
    sample = posts[:10]
    corpus = "\n\n".join(sample)

    hook, structure, vocab = await asyncio.gather(
        extract_hook_distribution(corpus),
        extract_structural_pattern(corpus),
        extract_vocabulary_register(corpus),
    )

    return AuditResponse(
        hook_distribution=hook if isinstance(hook, dict) else {},
        structural_pattern=structure if isinstance(structure, dict) else {},
        vocabulary_register=vocab if isinstance(vocab, dict) else {},
        post_count=len(posts),
    )
