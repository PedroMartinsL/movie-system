from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_health_check_returns_ok() -> None:
    response = client.get("/ai/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ai-service",
        "message": "AI service is running",
    }


def test_translate_subtitle_returns_translated_content_and_file_path(tmp_path) -> None:
    settings.output_dir = tmp_path

    payload = {
        "movie_id": "movie-001",
        "source_language": "en",
        "target_language": "pt-BR",
        "subtitle_content": "1\n00:00:01,000 --> 00:00:03,000\nHello, welcome to the movie.",
        "format": "srt",
    }

    response = client.post("/ai/translate-subtitle", json=payload)

    assert response.status_code == 200

    body = response.json()
    assert body["movie_id"] == "movie-001"
    assert body["source_language"] == "en"
    assert body["target_language"] == "pt-BR"
    assert body["format"] == "srt"
    assert body["status"] == "success"
    assert body["translated_subtitle"] == "1\n00:00:01,000 --> 00:00:03,000\nOlá, bem-vindo ao filme."
    assert body["file_path"] == "storage/output/movie-001_pt-BR.srt"

    saved_file = tmp_path / "movie-001_pt-BR.srt"
    assert saved_file.exists()
    assert (
        saved_file.read_text(encoding="utf-8")
        == "1\n00:00:01,000 --> 00:00:03,000\nOlá, bem-vindo ao filme."
    )


def test_translate_subtitle_returns_400_for_invalid_srt() -> None:
    payload = {
        "movie_id": "movie-001",
        "source_language": "en",
        "target_language": "pt-BR",
        "subtitle_content": "just a plain string",
        "format": "srt",
    }

    response = client.post("/ai/translate-subtitle", json=payload)

    assert response.status_code == 400
    assert "Invalid SRT content" in response.json()["detail"]


def test_translate_subtitle_handles_case_and_spacing_in_common_phrase(tmp_path) -> None:
    settings.output_dir = tmp_path

    payload = {
        "movie_id": "movie-002",
        "source_language": "en",
        "target_language": "pt-BR",
        "subtitle_content": "1\n00:00:01,000 --> 00:00:03,000\nHello, welcome To   the movie.",
        "format": "srt",
    }

    response = client.post("/ai/translate-subtitle", json=payload)

    assert response.status_code == 200
    assert (
        response.json()["translated_subtitle"]
        == "1\n00:00:01,000 --> 00:00:03,000\nOlá, bem-vindo ao filme."
    )
