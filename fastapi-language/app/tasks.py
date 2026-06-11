from app.celery_app import celery_app
from app.api.subtitle_tasks import generate_translated_subtitle


@celery_app.task(ignore_result=True)
def generate_translated_subtitle_task(movie_id: str, target_language: str, source_language: str | None = None):
    generate_translated_subtitle(movie_id, target_language, source_language)
