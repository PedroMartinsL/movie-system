import re

from app.utils.srt_utils import is_translatable_text_line, validate_srt_content


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
                mock_translate_text(
                    text=line,
                    source_language=source_language,
                    target_language=target_language,
                )
            )
            continue

        # Mantem linhas estruturais do SRT inalteradas.
        translated_lines.append(line)

    return "\n".join(translated_lines)
