from unittest.mock import AsyncMock, patch

import pytest

from services.llm.router import CircuitBreakerState, LLMProviderError, LLMResponse, llm_call


def test_circuit_breaker_opens_after_threshold():
    breaker = CircuitBreakerState()
    assert not breaker.is_open()
    breaker.record_failure()
    breaker.record_failure()
    assert not breaker.is_open()
    breaker.record_failure()
    assert breaker.is_open()


def test_circuit_breaker_resets_after_cooldown():
    import time
    breaker = CircuitBreakerState()
    breaker.record_failure()
    breaker.record_failure()
    breaker.record_failure()
    assert breaker.is_open()
    breaker.open_until = time.monotonic() - 1
    assert not breaker.is_open()
    assert breaker.failure_count == 0


def test_circuit_breaker_resets_window():
    import time
    breaker = CircuitBreakerState()
    breaker.record_failure()
    breaker.record_failure()
    breaker.first_failure_at = time.monotonic() - 120
    breaker.record_failure()  # resets window
    assert breaker.failure_count == 1
    assert not breaker.is_open()


@pytest.mark.asyncio
async def test_llm_call_uses_primary():
    # Primary for "generation" is now gpt-4o (OpenAI-only routing)
    mock_response = LLMResponse(content="result", model="gpt-4o", input_tokens=10, output_tokens=20)
    with patch("services.llm.router._call_openai", new=AsyncMock(return_value=mock_response)):
        result = await llm_call("generation", [{"role": "user", "content": "hello"}])
    assert result.model == "gpt-4o"
    assert result.content == "result"


@pytest.mark.asyncio
async def test_llm_call_falls_back_on_primary_failure():
    # Primary (gpt-4o) fails first call, fallback (gpt-4o-mini) succeeds second call
    fallback_response = LLMResponse(content="fallback", model="gpt-4o-mini", input_tokens=5, output_tokens=10)
    with patch(
        "services.llm.router._call_openai",
        new=AsyncMock(side_effect=[Exception("API down"), fallback_response]),
    ):
        result = await llm_call("generation", [{"role": "user", "content": "hello"}])
    assert result.content == "fallback"


@pytest.mark.asyncio
async def test_llm_call_raises_when_both_fail():
    with patch(
        "services.llm.router._call_openai",
        new=AsyncMock(side_effect=Exception("provider down")),
    ):
        with pytest.raises(LLMProviderError):
            await llm_call("generation", [{"role": "user", "content": "hello"}])


@pytest.mark.asyncio
async def test_circuit_breaker_skips_primary_when_open():
    import time

    from services.llm.router import _circuit_breakers
    _circuit_breakers["extraction"].failure_count = 3
    _circuit_breakers["extraction"].open_until = time.monotonic() + 300

    fallback_response = LLMResponse(content="ok", model="gpt-4o-mini", input_tokens=5, output_tokens=5)
    call_count = {"n": 0}

    async def fake_openai(model, messages, max_tokens, json_mode, system=None):
        call_count["n"] += 1
        # When circuit is open, only the fallback (gpt-4o-mini) should be called
        assert model == "gpt-4o-mini", f"Primary was called when circuit is open (model={model})"
        return fallback_response

    with patch("services.llm.router._call_openai", new=fake_openai):
        result = await llm_call("extraction", [{"role": "user", "content": "test"}])

    assert call_count["n"] == 1
    assert result.model == "gpt-4o-mini"

    # Reset for other tests
    _circuit_breakers["extraction"].failure_count = 0
    _circuit_breakers["extraction"].open_until = 0.0
