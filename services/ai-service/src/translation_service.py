# ═══════════════════════════════════════════════════════════════════════════
# TRADUÇÃO — usa o LibreTranslate (serviço gratuito rodando no nosso servidor).
# Idiomas que geramos: português, inglês e espanhol.
# ═══════════════════════════════════════════════════════════════════════════
import requests
import os
import re

LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://libretranslate:5000")
TARGET_LANGUAGES = ["pt", "en", "es"]


# Traduz um pedaço de texto de um idioma para outro.
def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    if source_lang == target_lang:
        return text  # mesmo idioma: não precisa traduzir
    try:
        # Chama o LibreTranslate por HTTP e pega o texto traduzido.
        resp = requests.post(
            f"{LIBRETRANSLATE_URL}/translate",
            json={"q": text, "source": source_lang, "target": target_lang, "format": "text"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("translatedText", text)
    except Exception as e:
        # Se a tradução falhar, devolve o texto original (não quebra o sistema).
        print(f"Translation error {source_lang}→{target_lang}: {e}")
        return text


# O TRUQUE IMPORTANTE: traduz a legenda VTT SEM bagunçar os horários.
def translate_vtt(vtt_content: str, source_lang: str, target_lang: str) -> str:
    if source_lang == target_lang:
        return vtt_content

    lines = vtt_content.split("\n")
    result = []
    i = 0
    # Percorre a legenda linha por linha.
    while i < len(lines):
        line = lines[i]
        # Se a linha é um horário (ex: "00:00:01.000 --> 00:00:03.000"),
        # NÃO traduz: copia igual e vai pras linhas de texto seguintes.
        if "-->" in line:
            result.append(line)
            i += 1
            text_lines = []
            # Junta as linhas de texto que vêm logo abaixo do horário.
            while i < len(lines) and lines[i].strip() != "" and "-->" not in lines[i]:
                text_lines.append(lines[i])
                i += 1
            original_text = "\n".join(text_lines)
            # Só o TEXTO é traduzido.
            translated = translate_text(original_text, source_lang, target_lang)
            result.append(translated)
        else:
            # Outras linhas (cabeçalho, número, linha em branco): copia igual.
            result.append(line)
            i += 1

    return "\n".join(result)


# Dado o idioma original, devolve os outros idiomas que faltam traduzir.
def get_target_languages(source_lang: str) -> list:
    return [lang for lang in TARGET_LANGUAGES if lang != source_lang]
