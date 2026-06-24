"""StyleDistance ONNX encoder - shadow mode.

Wraps the StyleDistance pretrained style encoder for non-content style embeddings
(768-dim, separate from OpenAI content embeddings).

Shadow mode: the model is never a hard dependency. When unavailable, all calls
return None gracefully. The pipeline stores the embedding for future analysis
but never blocks on it.

To activate:
    pip install optimum[onnxruntime] transformers
    python -m optimum.exporters.onnx --model StyleDistance/styledistance \\
        apps/api/onnx/styledistance/
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).parent.parent.parent / "onnx" / "styledistance"

_encoder: tuple | None = None
_available: bool | None = None


def is_available() -> bool:
    """True if the StyleDistance ONNX model is loaded and ready."""
    global _available
    if _available is not None:
        return _available
    _load()
    return bool(_available)


def _load() -> None:
    global _encoder, _available
    if _available is not None:
        return
    if not _MODEL_PATH.exists():
        _available = False
        logger.info("StyleDistance model not found at %s - shadow mode inactive", _MODEL_PATH)
        return
    try:
        from optimum.onnxruntime import ORTModelForFeatureExtraction
        from transformers import AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(str(_MODEL_PATH))
        model = ORTModelForFeatureExtraction.from_pretrained(str(_MODEL_PATH))
        _encoder = (tokenizer, model)
        _available = True
        logger.info("StyleDistance ONNX model loaded from %s", _MODEL_PATH)
    except Exception as exc:
        _available = False
        logger.warning("StyleDistance unavailable: %s", exc)


def encode(text: str) -> list[float] | None:
    """Encode text into a 768-dim style embedding. Returns None if unavailable."""
    if not is_available() or _encoder is None:
        return None
    try:
        import numpy as np

        tokenizer, model = _encoder
        inputs = tokenizer(
            text[:1024],
            return_tensors="np",
            truncation=True,
            padding=True,
            max_length=256,
        )
        outputs = model(**inputs)
        emb = outputs.last_hidden_state[0].mean(axis=0)
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb.tolist()
    except Exception as exc:
        logger.warning("StyleDistance encode failed: %s", exc)
        return None
