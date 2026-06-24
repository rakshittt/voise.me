import time
from dataclasses import dataclass, field


@dataclass
class _WindowState:
    count: int = 0
    window_start: float = field(default_factory=time.monotonic)


# In-memory store: (user_id_str, endpoint) → _WindowState
_store: dict[tuple[str, str], _WindowState] = {}

LIMITS: dict[str, tuple[int, int]] = {
    "generate": (30, 3600),
    "voice_profile_build": (1, 600),
    "capture_upload": (20, 3600),
    "repurpose": (10, 3600),
    "dna_match": (20, 3600),
    "fetch_url": (10, 3600),
    "ideas": (10, 3600),
}


def check_rate_limit(user_id: str, endpoint: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds). allowed=False means limit exceeded."""
    if endpoint not in LIMITS:
        return True, 0

    max_calls, window_seconds = LIMITS[endpoint]
    key = (user_id, endpoint)
    now = time.monotonic()

    state = _store.get(key)
    if state is None or (now - state.window_start) >= window_seconds:
        _store[key] = _WindowState(count=1, window_start=now)
        return True, 0

    if state.count >= max_calls:
        retry_after = int(window_seconds - (now - state.window_start)) + 1
        return False, retry_after

    state.count += 1
    return True, 0
