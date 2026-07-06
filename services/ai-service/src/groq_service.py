# ═══════════════════════════════════════════════════════════════════════════
# TRANSCRIÇÃO POR IA — usa a Groq (nuvem) com o modelo Whisper.
# É aqui que o áudio vira texto com os tempos de cada fala.
# ═══════════════════════════════════════════════════════════════════════════
import os
from groq import Groq

_client = None


# Cria (uma única vez) o cliente da Groq usando a chave de API.
def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


# Recebe o caminho do áudio e devolve {idioma, segmentos (falas com tempo)}.
def transcribe_audio(audio_path: str) -> dict:
    client = get_client()
    with open(audio_path, "rb") as f:
        # Envia o áudio pra IA. O modelo Whisper detecta o idioma e transcreve.
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), f),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["segment"],  # queremos os tempos por trecho
        )

    segments = []
    if hasattr(transcription, "segments") and transcription.segments:
        for s in transcription.segments:
            if isinstance(s, dict):
                segments.append({"start": s.get("start", 0), "end": s.get("end", 0), "text": s.get("text", "")})
            else:
                segments.append({"start": s.start, "end": s.end, "text": s.text})

    language = getattr(transcription, "language", "en") or "en"
    return {"language": language, "segments": segments}


# Converte os "segmentos" da IA para o formato de legenda VTT (padrão da web).
# Cada bloco fica: número, "início --> fim" e o texto da fala.
def segments_to_vtt(segments: list) -> str:
    lines = ["WEBVTT", ""]
    for i, seg in enumerate(segments, 1):
        start = _format_timestamp(seg["start"])
        end = _format_timestamp(seg["end"])
        text = seg["text"].strip()
        lines.append(str(i))
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def _format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
