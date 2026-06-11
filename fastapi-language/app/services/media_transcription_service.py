import shutil
import subprocess
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


class MediaTranscriptionError(Exception):
    """Erro esperado no pipeline de extracao/transcricao de midia."""


VIDEO_EXTENSIONS = {".mp4", ".mkv", ".mov", ".webm", ".avi"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"}


def format_timestamp(seconds: float) -> str:
    milliseconds_total = int(seconds * 1000)
    milliseconds = milliseconds_total % 1000
    seconds_total = milliseconds_total // 1000
    seconds_value = seconds_total % 60
    minutes_total = seconds_total // 60
    minutes = minutes_total % 60
    hours = minutes_total // 60
    return f"{hours:02}:{minutes:02}:{seconds_value:02},{milliseconds:03}"


def segments_to_srt(segments) -> str:
    blocks = []
    for index, segment in enumerate(segments, start=1):
        text = segment.text.strip()
        if not text:
            continue

        blocks.append(
            "\n".join(
                [
                    str(index),
                    f"{format_timestamp(segment.start)} --> {format_timestamp(segment.end)}",
                    text,
                ]
            )
        )

    return "\n\n".join(blocks)


def save_upload_file(upload_file: UploadFile, target_dir: Path) -> Path:
    suffix = Path(upload_file.filename or "media").suffix.lower()
    if suffix not in VIDEO_EXTENSIONS | AUDIO_EXTENSIONS:
        raise MediaTranscriptionError("Unsupported media format.")

    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{uuid4()}{suffix}"
    with target_path.open("wb") as output:
        shutil.copyfileobj(upload_file.file, output)
    return target_path


def extract_audio_from_video(video_path: Path, target_dir: Path) -> Path:
    audio_path = target_dir / f"{video_path.stem}.wav"
    command = [
        settings.ffmpeg_path,
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(audio_path),
    ]
    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except FileNotFoundError as exc:
        raise MediaTranscriptionError("ffmpeg was not found.") from exc
    except subprocess.CalledProcessError as exc:
        raise MediaTranscriptionError(f"Could not extract audio from video: {exc.stderr}") from exc

    return audio_path


def transcribe_audio_to_srt(audio_path: Path, language: str) -> str:
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise MediaTranscriptionError(
            "faster-whisper is not installed. Install dependencies before real transcription."
        ) from exc

    model = WhisperModel(
        settings.whisper_model,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )
    segments, _ = model.transcribe(
        str(audio_path),
        language=language,
        vad_filter=True,
    )
    subtitle_content = segments_to_srt(segments)
    if not subtitle_content.strip():
        raise MediaTranscriptionError("Transcription returned no subtitle text.")
    return subtitle_content


def transcribe_media_upload(upload_file: UploadFile, language: str) -> str:
    work_dir = settings.media_work_dir / str(uuid4())
    media_path = save_upload_file(upload_file, work_dir)
    audio_path = media_path

    if media_path.suffix.lower() in VIDEO_EXTENSIONS:
        audio_path = extract_audio_from_video(media_path, work_dir)

    return transcribe_audio_to_srt(audio_path, language)
