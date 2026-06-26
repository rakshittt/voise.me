import logging
import time
from dataclasses import dataclass
from typing import Any

import openai

from config import settings

logger = logging.getLogger(__name__)

# Task → (primary model, fallback model)
# Matches CLAUDE.md spec exactly
TASK_MODELS: dict[str, tuple[str, str]] = {
    "generation": ("claude-sonnet-4-6", "gpt-4o"),
    "scoring": ("gpt-4o-mini", "gpt-4o-mini"),
    "extraction": ("claude-sonnet-4-6", "gpt-4o-mini"),
    # Deep fingerprint sub-tasks: gpt-4o-mini is fast/cheap, fine for classification
    "deep_extraction": ("gpt-4o-mini", "gpt-4o-mini"),
    "titling": ("gpt-4o-mini", "gpt-4o-mini"),
    "repurpose": ("claude-sonnet-4-6", "gpt-4o"),
}


@dataclass
class CircuitBreakerState:
    failure_count: int = 0
    first_failure_at: float = 0.0
    open_until: float = 0.0

    FAILURE_THRESHOLD: int = 3
    WINDOW_SECONDS: float = 60.0
    COOLDOWN_SECONDS: float = 300.0

    def record_failure(self) -> None:
        now = time.monotonic()
        if self.first_failure_at == 0.0 or (now - self.first_failure_at) > self.WINDOW_SECONDS:
            self.failure_count = 1
            self.first_failure_at = now
        else:
            self.failure_count += 1

        if self.failure_count >= self.FAILURE_THRESHOLD:
            self.open_until = now + self.COOLDOWN_SECONDS
            logger.warning(
                f"Circuit breaker opened - primary will be skipped for {self.COOLDOWN_SECONDS}s"
            )

    def is_open(self) -> bool:
        if self.open_until == 0.0:
            return False
        if time.monotonic() >= self.open_until:
            self.failure_count = 0
            self.first_failure_at = 0.0
            self.open_until = 0.0
            logger.info("Circuit breaker reset - primary model re-enabled")
            return False
        return True

    def record_success(self) -> None:
        self.failure_count = 0
        self.first_failure_at = 0.0
        self.open_until = 0.0


# One circuit breaker per task
_circuit_breakers: dict[str, CircuitBreakerState] = {task: CircuitBreakerState() for task in TASK_MODELS}


@dataclass
class LLMResponse:
    content: str
    model: str
    input_tokens: int
    output_tokens: int


def _is_claude_model(model: str) -> bool:
    return model.startswith("claude-")


async def _call_openai(
    model: str, messages: list[dict], max_tokens: int, json_mode: bool, system: str | None = None
) -> LLMResponse:
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    full_messages = ([{"role": "system", "content": system}] + messages) if system else messages
    kwargs: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": full_messages,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content or ""
    return LLMResponse(
        content=content,
        model=model,
        input_tokens=response.usage.prompt_tokens if response.usage else 0,
        output_tokens=response.usage.completion_tokens if response.usage else 0,
    )


async def _call_anthropic(
    model: str, messages: list[dict], max_tokens: int, json_mode: bool, system: str | None = None
) -> LLMResponse:
    import anthropic as anthropic_sdk
    client = anthropic_sdk.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_text = system or ""
    # Claude has no response_format json_mode - instruct via system prompt when needed
    if json_mode and "JSON" not in system_text.upper():
        system_text = (system_text + "\n\nReturn ONLY valid JSON. No preamble, no explanation.").strip()

    kwargs: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system_text:
        kwargs["system"] = system_text

    response = await client.messages.create(**kwargs)
    content = response.content[0].text if response.content else ""
    return LLMResponse(
        content=content,
        model=model,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
    )


async def _dispatch(
    model: str, messages: list[dict], max_tokens: int, json_mode: bool, system: str | None
) -> LLMResponse:
    if _is_claude_model(model):
        return await _call_anthropic(model, messages, max_tokens, json_mode, system)
    return await _call_openai(model, messages, max_tokens, json_mode, system)


async def llm_call(
    task: str,
    messages: list[dict],
    max_tokens: int = 1000,
    json_mode: bool = False,
    system: str | None = None,
) -> LLMResponse:
    if task not in TASK_MODELS:
        raise ValueError(f"Unknown task: {task}. Must be one of {list(TASK_MODELS.keys())}")

    primary, fallback = TASK_MODELS[task]
    breaker = _circuit_breakers[task]

    if not breaker.is_open():
        try:
            result = await _dispatch(primary, messages, max_tokens, json_mode, system)
            breaker.record_success()
            logger.debug(f"LLM [{task}] primary={primary} in={result.input_tokens} out={result.output_tokens}")
            return result
        except Exception as e:
            breaker.record_failure()
            logger.warning(f"LLM [{task}] primary={primary} failed ({type(e).__name__}: {e}), trying fallback")

    logger.info(f"LLM [{task}] using fallback={fallback}")
    try:
        result = await _dispatch(fallback, messages, max_tokens, json_mode, system)
        logger.debug(f"LLM [{task}] fallback={fallback} in={result.input_tokens} out={result.output_tokens}")
        return result
    except Exception as e:
        logger.error(f"LLM [{task}] fallback={fallback} also failed: {e}")
        raise LLMProviderError(f"Both primary ({primary}) and fallback ({fallback}) failed for task '{task}'") from e


class LLMProviderError(Exception):
    pass
