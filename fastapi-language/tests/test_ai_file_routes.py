from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_transcribe_file_returns_real_srt_response(monkeypatch, tmp_path) -> None:
    settings.output_dir = tmp_path

    def fake_transcribe_media_upload(upload_file, language):
        assert upload_file.filename == "sample.mp3"
        assert language == "en"
        return "1\n00:00:01,000 --> 00:00:03,000\nReal transcription text."

    monkeypatch.setattr(
        "app.api.ai_routes.transcribe_media_upload",
        fake_transcribe_media_upload,
    )

    response = client.post(
        "/ai/transcribe-file",
        data={
            "movie_id": "movie-file-001",
            "source_language": "en",
        },
        files={
            "file": ("sample.mp3", b"fake audio bytes", "audio/mpeg"),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["movie_id"] == "movie-file-001"
    assert body["source_language"] == "en"
    assert body["status"] == "ready"
    assert body["source_media"] == "sample.mp3"
    assert body["subtitle_content"] == "1\n00:00:01,000 --> 00:00:03,000\nReal transcription text."
    assert (tmp_path / "movie-file-001_en.srt").exists()
