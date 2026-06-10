import re

import httpx

from app.core.config import settings
from app.utils.srt_utils import is_translatable_text_line, validate_srt_content


class TranslationServiceError(Exception):
    """Erro esperado ao chamar o provedor de IA."""


def mock_translate_text(text: str, source_language: str, target_language: str) -> str:
    """
    Simula a traducao de texto com substituicoes simples de palavras.
    Esta funcao existe apenas para o MVP e sera trocada por IA real no futuro.
    """
    # TODO: substituir esta função mockada por integração real com IA, como OpenAI, Gemini, Whisper ou outro modelo.
    _ = source_language
    _ = target_language

     # Isso é apenas um caso de Teste.
    phrase_patterns = (
        (re.compile(r"\bto\s+the\b", flags=re.IGNORECASE), "ao"),
    )

    replacements = {
        "Hello": "Olá",
        "hello": "olá",
        "welcome": "bem-vindo",
        "Welcome": "Bem-vindo",
        "movie": "filme",
        "Movie": "Filme",
        "good": "bom",
        "Good": "Bom",
        "morning": "manhã",
        "Morning": "Manhã",
        "night": "noite",
        "Night": "Noite",
    }

    translated = text
    for pattern, replacement in phrase_patterns:
        translated = pattern.sub(replacement, translated)

    for source_word, target_word in replacements.items():
        translated = translated.replace(source_word, target_word)

    return translated


def ollama_translate_text(text: str, source_language: str, target_language: str) -> str:
    """
    Traduz uma linha de legenda usando o Ollama local.
    O prompt pede somente o texto traduzido para nao quebrar o formato SRT.
    """
    prompt = (
        "You are a subtitle translation engine.\n"
        f"Translate the following subtitle line from {source_language} to {target_language}.\n"
        "Return only the translated subtitle line, without explanations, quotes, markdown, "
        "timestamps, numbering, or extra text.\n\n"
        f"Subtitle line:\n{text}"
    )

    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0,
                },
            },
            timeout=settings.ollama_timeout_seconds,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise TranslationServiceError(
            "Could not translate subtitle with Ollama. "
            "Check if Ollama is running and the selected model is available."
        ) from exc

    translated = response.json().get("response", "").strip()
    if not translated:
        raise TranslationServiceError("Ollama returned an empty translation.")
    return translated


def translate_text(text: str, source_language: str, target_language: str) -> str:
    """
    Seleciona o provedor de traducao.
    Use AI_PROVIDER=ollama para chamar o Ollama local.
    """
    if settings.ai_provider == "ollama":
        return ollama_translate_text(text, source_language, target_language)

    return mock_translate_text(text, source_language, target_language)


def translate_srt_subtitle(
    subtitle_content: str,
    source_language: str,
    target_language: str,
) -> str:
    """
    Traduz somente as linhas de texto da legenda SRT.
    Numeracao, timestamps e linhas vazias sao preservados sem alteracao.
    """

    # Valida o conteudo minimo esperado para considerar o texto como SRT.
    validate_srt_content(subtitle_content)

    translated_lines = []
    for line in subtitle_content.splitlines():
        if is_translatable_text_line(line):
            # Traduz apenas linhas de fala/descritivas.
            translated_lines.append(
                translate_text(
                    text=line,
                    source_language=source_language,
                    target_language=target_language,
                )
            )
            continue

        # Mantem linhas estruturais do SRT inalteradas.
        translated_lines.append(line)

    return "\n".join(translated_lines)
