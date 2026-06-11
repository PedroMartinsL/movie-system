from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_catalog_get_user_languages_returns_plain_string_list() -> None:
    client.post(
        "/user/languages",
        json={
            "user_id": "catalog-user-1",
            "languages": ["en-US", "pt-BR"],
        },
    )

    response = client.get("/catalog/users/catalog-user-1/languages")

    assert response.status_code == 200
    assert response.json() == ["en-US", "pt-BR"]


def test_catalog_get_available_subtitle_languages_returns_plain_string_list() -> None:
    client.post("/movies/catalog-movie-1/language", json={"language": "en"})
    client.post(
        "/ai/transcribe",
        json={
            "movie_id": "catalog-movie-1",
            "source_language": "en",
            "format": "srt",
        },
    )

    response = client.get("/catalog/movies/catalog-movie-1/subtitles/languages")

    assert response.status_code == 200
    assert response.json() == ["en"]


def test_catalog_bind_and_remove_movie_subtitles() -> None:
    bind_response = client.post("/catalog/movies/catalog-movie-2/subtitles/bind")

    assert bind_response.status_code == 204

    remove_response = client.delete("/catalog/movies/catalog-movie-2/subtitles/bind")

    assert remove_response.status_code == 204
