import whisper
import os
import tempfile
import json

_model = None

def get_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "small")
        print(f"Loading Whisper model: {model_name}")
        _model = whisper.load_model(model_name)
    return _model


def transcribe_audio(audio_path: str) -> dict:
    model = get_model()
    result = model.transcribe(audio_path, task="transcribe")
    return result


def segments_to_vtt(segments: list) -> str:
    lines = ["WEBVTT", ""]
    for i, seg in enumerate(segments, 1):
        start = format_timestamp(seg["start"])
        end = format_timestamp(seg["end"])
        text = seg["text"].strip()
        lines.append(f"{i}")
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}".replace(".", ".")
