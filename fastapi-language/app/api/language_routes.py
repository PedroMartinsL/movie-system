from fastapi import APIRouter, HTTPException, Response, status

from app.schemas.language_schema import (
    LanguageCreateRequest,
    LanguageResponse,
    MovieLanguageRequest,
    MovieLanguageResponse,
    UserLanguagesRequest,
    UserLanguagesResponse,
)
from app.services.subtitle_repository import subtitle_repository

router = APIRouter(tags=["idiomas"])


@router.post("/idioma/", response_model=LanguageResponse, status_code=status.HTTP_201_CREATED)
def create_language(payload: LanguageCreateRequest) -> LanguageResponse:
    language = subtitle_repository.create_language(payload.name)
    return LanguageResponse(id=language.id, name=language.name)


@router.get("/idiomas/", response_model=list[LanguageResponse])
def list_languages() -> list[LanguageResponse]:
    return [
        LanguageResponse(id=language.id, name=language.name)
        for language in subtitle_repository.list_languages()
    ]


@router.post("/movies/{movie_id}/language", response_model=MovieLanguageResponse)
def set_movie_language(
    movie_id: str,
    payload: MovieLanguageRequest,
) -> MovieLanguageResponse:
    language = subtitle_repository.set_movie_original_language(movie_id, payload.language)
    return MovieLanguageResponse(movie_id=movie_id, language=language)


@router.post("/user/languages", response_model=UserLanguagesResponse)
def set_user_languages(payload: UserLanguagesRequest) -> UserLanguagesResponse:
    languages = subtitle_repository.set_user_languages(payload.user_id, payload.languages)
    return UserLanguagesResponse(user_id=payload.user_id, languages=languages)


@router.get("/user/{user_id}/languages", response_model=UserLanguagesResponse)
def list_user_languages(user_id: str) -> UserLanguagesResponse:
    return UserLanguagesResponse(
        user_id=user_id,
        languages=subtitle_repository.list_user_languages(user_id),
    )


@router.delete("/user/{user_id}/languages/{language}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_language(user_id: str, language: str) -> Response:
    deleted = subtitle_repository.delete_user_language(user_id, language)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User language was not found.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
