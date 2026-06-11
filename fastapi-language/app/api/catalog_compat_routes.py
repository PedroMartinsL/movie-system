from fastapi import APIRouter, Response, status

from app.services.subtitle_repository import subtitle_repository

router = APIRouter(tags=["catalog-compat"])


@router.get("/catalog/users/{user_id}/languages", response_model=list[str])
def get_user_languages_for_catalog(user_id: str) -> list[str]:
    return subtitle_repository.list_user_languages(user_id)


@router.get("/catalog/movies/{movie_id}/subtitles/languages", response_model=list[str])
def get_available_subtitle_languages_for_catalog(movie_id: str) -> list[str]:
    return [
        subtitle.locale
        for subtitle in subtitle_repository.list_movie_subtitles(movie_id)
        if subtitle.status == "ready"
    ]


@router.get("/catalog/movies/{movie_id}/subtitles", response_model=list[str])
def get_subtitles_for_catalog(movie_id: str) -> list[str]:
    return [
        subtitle.locale
        for subtitle in subtitle_repository.list_movie_subtitles(movie_id)
        if subtitle.status == "ready"
    ]


@router.post("/catalog/movies/{movie_id}/subtitles/bind", status_code=status.HTTP_204_NO_CONTENT)
def create_subtitle_bind_for_catalog(movie_id: str) -> Response:
    if not subtitle_repository.get_movie_original_language(movie_id):
        subtitle_repository.set_movie_original_language(movie_id, "en")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/catalog/movies/{movie_id}/subtitles/bind", status_code=status.HTTP_204_NO_CONTENT)
def remove_subtitle_bind_for_catalog(movie_id: str) -> Response:
    subtitle_repository.remove_movie_subtitles(movie_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
