from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_create_and_list_languages() -> None:
    create_response = client.post("/idioma/", json={"name": "en-JM"})

    assert create_response.status_code == 201
    assert create_response.json()["name"] == "en-JM"

    list_response = client.get("/idiomas/")

    assert list_response.status_code == 200
    languages = [language["name"] for language in list_response.json()]
    assert "en-JM" in languages


def test_player_manifest_returns_secure_hls_url() -> None:
    response = client.get("/player/movie-001/manifest")

    assert response.status_code == 200
    body = response.json()
    assert body["movie_id"] == "movie-001"
    assert body["status"] == "ready"
    assert body["streaming_format"] == "HLS"
    assert body["manifest_url"].endswith("/movies/movie-001/manifest.m3u8")
    assert "token=mock-secure-token" in body["secure_url"]


def test_player_subtitle_starts_generation_then_returns_ready() -> None:
    settings.output_dir = Path("fastapi-language/storage/test-output").resolve()

    first_response = client.get("/player/movie-001/subtitles", params={"lang": "es"})

    assert first_response.status_code == 202
    assert first_response.json()["status"] == "processing"

    second_response = client.get("/player/movie-001/subtitles", params={"lang": "es"})

    assert second_response.status_code == 200
    body = second_response.json()
    assert body["movie_id"] == "movie-001"
    assert body["locale"] == "es"
    assert body["format"] == "srt"
    assert body["status"] == "ready"
    assert "00:00:01,000 --> 00:00:03,000" in body["subtitle_content"]
    assert "bem-vindo ao filme" in body["subtitle_content"]

    generated_file = settings.output_dir / "movie-001_es.srt"
    if generated_file.exists():
        generated_file.unlink()
