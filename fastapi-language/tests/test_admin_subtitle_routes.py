from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_admin_lists_available_and_missing_subtitle_languages() -> None:
    client.post("/idioma/", json={"name": "it"})
    client.post("/idioma/", json={"name": "ru"})
    client.post("/movies/admin-movie-001/language", json={"language": "en"})
    client.post(
        "/ai/transcribe",
        json={
            "movie_id": "admin-movie-001",
            "source_language": "en",
            "format": "srt",
        },
    )

    response = client.get("/admin/movies/admin-movie-001/subtitles")

    assert response.status_code == 200
    body = response.json()
    assert body["movie_id"] == "admin-movie-001"
    assert body["original_language"] == "en"
    assert body["available_subtitles"][0]["locale"] == "en"
    assert "it" in body["missing_languages"]
    assert "ru" in body["missing_languages"]


def test_admin_generates_new_subtitle_for_movie() -> None:
    client.post("/idioma/", json={"name": "de"})
    client.post("/movies/admin-movie-002/language", json={"language": "en"})
    client.post(
        "/ai/transcribe",
        json={
            "movie_id": "admin-movie-002",
            "source_language": "en",
            "format": "srt",
        },
    )

    generate_response = client.post(
        "/admin/movies/admin-movie-002/subtitles/generate",
        json={"target_language": "de"},
    )

    assert generate_response.status_code == 202
    assert generate_response.json()["status"] == "processing"

    subtitle_response = client.get(
        "/player/admin-movie-002/subtitles",
        params={"lang": "de"},
    )

    assert subtitle_response.status_code == 200
    assert subtitle_response.json()["status"] == "ready"
    assert subtitle_response.json()["locale"] == "de"


def test_sets_and_lists_user_languages() -> None:
    response = client.post(
        "/user/languages",
        json={
            "user_id": "2",
            "languages": ["en-US", "es", "pt-BR"],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "user_id": "2",
        "languages": ["en-US", "es", "pt-BR"],
    }

    list_response = client.get("/user/2/languages")

    assert list_response.status_code == 200
    assert list_response.json()["languages"] == ["en-US", "es", "pt-BR"]

    delete_response = client.delete("/user/2/languages/es")

    assert delete_response.status_code == 204

    list_after_delete_response = client.get("/user/2/languages")

    assert list_after_delete_response.json()["languages"] == ["en-US", "pt-BR"]
