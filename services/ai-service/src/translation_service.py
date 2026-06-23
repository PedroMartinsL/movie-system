import requests
import os
import re

LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://libretranslate:5000")
TARGET_LANGUAGES = ["pt", "en", "es"]


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    if source_lang == target_lang:
        return text
    try:
        resp = requests.post(
            f"{LIBRETRANSLATE_URL}/translate",
            json={"q": text, "source": source_lang, "target": target_lang, "format": "text"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("translatedText", text)
    except Exception as e:
        print(f"Translation error {source_lang}→{target_lang}: {e}")
        return text


def translate_vtt(vtt_content: str, source_lang: str, target_lang: str) -> str:
    if source_lang == target_lang:
        return vtt_content

    lines = vtt_content.split("\n")
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Linha de timestamp  ex: "00:00:01.000 --> 00:00:03.000"
        if "-->" in line:
            result.append(line)
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip() != "" and "-->" not in lines[i]:
                text_lines.append(lines[i])
                i += 1
            original_text = "\n".join(text_lines)
            translated = translate_text(original_text, source_lang, target_lang)
            result.append(translated)
        else:
            result.append(line)
            i += 1

    return "\n".join(result)


def get_target_languages(source_lang: str) -> list:
    return [lang for lang in TARGET_LANGUAGES if lang != source_lang]
