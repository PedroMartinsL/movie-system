import os
import uuid
import tempfile
import subprocess
import requests
from minio import Minio
from sqlalchemy.orm import Session
from database import SessionLocal, ProcessingJob
from whisper_service import transcribe_audio, segments_to_vtt
from translation_service import translate_vtt, get_target_languages

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio")
MINIO_PORT = int(os.getenv("MINIO_PORT", "9000"))
MINIO_USER = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_PASS = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin123")
SUBTITLE_SERVICE_URL = os.getenv("SUBTITLE_SERVICE_URL", "http://subtitle-service:8004")

minio_client = Minio(
    f"{MINIO_ENDPOINT}:{MINIO_PORT}",
    access_key=MINIO_USER,
    secret_key=MINIO_PASS,
    secure=False,
)


def process_video(job_id: str, movie_id: str, bucket_name: str, object_name: str):
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.status = "PROCESSING"
            db.commit()

        with tempfile.TemporaryDirectory() as tmpdir:
            video_path = os.path.join(tmpdir, "video.mp4")
            audio_path = os.path.join(tmpdir, "audio.wav")

            print(f"[AI] Baixando vídeo: {bucket_name}/{object_name}")
            minio_client.fget_object(bucket_name, object_name, video_path)

            print("[AI] Extraindo áudio com FFmpeg")
            subprocess.run([
                "ffmpeg", "-i", video_path,
                "-vn", "-acodec", "pcm_s16le",
                "-ar", "16000", "-ac", "1",
                audio_path, "-y"
            ], check=True, capture_output=True)

            print("[AI] Transcrevendo com Whisper")
            result = transcribe_audio(audio_path)
            source_lang = result.get("language", "en")
            segments = result.get("segments", [])
            original_vtt = segments_to_vtt(segments)

            print(f"[AI] Idioma detectado: {source_lang}")

            # Salva legenda no idioma original
            _post_subtitle(movie_id, source_lang, original_vtt)

            # Traduz para outros idiomas
            for target_lang in get_target_languages(source_lang):
                print(f"[AI] Traduzindo para: {target_lang}")
                translated_vtt = translate_vtt(original_vtt, source_lang, target_lang)
                _post_subtitle(movie_id, target_lang, translated_vtt)

            if job:
                job.status = "COMPLETED"
                job.source_language = source_lang
                db.commit()

        print(f"[AI] Job {job_id} concluído com sucesso")

    except Exception as e:
        print(f"[AI] Erro no job {job_id}: {e}")
        if job:
            job.status = "ERROR"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()


def _post_subtitle(movie_id: str, language: str, content: str):
    try:
        resp = requests.post(
            f"{SUBTITLE_SERVICE_URL}/subtitles",
            json={"movie_id": movie_id, "language": language, "content": content, "source": "AI_GENERATED", "status": "READY"},
            timeout=30,
        )
        resp.raise_for_status()
        print(f"[AI] Legenda {language} salva para filme {movie_id}")
    except Exception as e:
        print(f"[AI] Erro ao salvar legenda {language}: {e}")
