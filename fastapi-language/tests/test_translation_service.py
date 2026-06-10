from app.core.config import settings
from app.services.translation_service import translate_srt_subtitle


class FakeOllamaResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, str]:
        return {"response": "Ola, bem-vindo ao filme."}


def test_translate_srt_subtitle_uses_ollama_provider(monkeypatch) -> None:
    original_provider = settings.ai_provider
    settings.ai_provider = "ollama"

    calls = []

    def fake_post(url, json, timeout):
        calls.append({"url": url, "json": json, "timeout": timeout})
        return FakeOllamaResponse()

    monkeypatch.setattr("app.services.translation_service.httpx.post", fake_post)

    try:
        result = translate_srt_subtitle(
            subtitle_content="1\n00:00:01,000 --> 00:00:03,000\nHello, welcome to the movie.",
            source_language="en",
            target_language="pt-BR",
        )
    finally:
        settings.ai_provider = original_provider

    assert result == "1\n00:00:01,000 --> 00:00:03,000\nOla, bem-vindo ao filme."
    assert calls[0]["url"].endswith("/api/generate")
    assert calls[0]["json"]["model"] == settings.ollama_model
    assert calls[0]["json"]["stream"] is False
