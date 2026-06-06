"""LLM service — wraps OpenAI-compatible API calls (DeepSeek / Qwen / etc.)."""

import httpx
from ..core.config import settings

# Timeout for LLM calls (seconds)
LLM_TIMEOUT = 60.0


def _chat_url() -> str:
    """Build the full chat completions URL from the configured base URL."""
    base = settings.llm_base_url.rstrip("/")
    # Auto-detect if the URL already includes /v1 or /chat/completions
    if base.endswith("/chat/completions"):
        return base
    if "/v1" in base:
        return f"{base}/chat/completions"
    return f"{base}/v1/chat/completions"


async def chat_completion(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 500,
) -> str:
    """Send a chat completion request and return the assistant's reply text.

    Supports any OpenAI-compatible API (DeepSeek, Qwen, OpenAI, etc.).

    Args:
        messages: List of {"role": "system"|"user"|"assistant", "content": "..."}
        model: Model name, defaults to settings.llm_model
        temperature: Sampling temperature (0-1, higher = more creative)
        max_tokens: Max tokens in the response

    Returns:
        The assistant's reply text.

    Raises:
        httpx.HTTPError: On network or API errors.
        ValueError: If the API key is not configured.
    """
    api_key = settings.llm_api_key
    if not api_key or api_key == "your-api-key-here":
        raise ValueError(
            "LLM_API_KEY is not configured. Set it in backend/.env to your API key."
        )

    payload = {
        "model": model or settings.llm_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    url = _chat_url()
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    choice = data["choices"][0]
    return choice["message"]["content"]


def is_llm_configured() -> bool:
    """Check whether a real LLM API key has been set."""
    key = settings.llm_api_key
    return bool(key) and key != "your-api-key-here"
