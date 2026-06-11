from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.api.subtitle_tasks import (
    build_available_subtitle_response,
    generate_translated_subtitle,
)
from app.schemas.player_schema import (
    GenerateSubtitleRequest,
    GenerateSubtitleResponse,
    MovieSubtitlesAdminResponse,
)
from app.services.subtitle_repository import subtitle_repository

router = APIRouter(tags=["admin-subtitles"])


@router.get(
    "/admin/movies/{movie_id}/subtitles",
    response_model=MovieSubtitlesAdminResponse,
)
def list_movie_subtitles_for_admin(movie_id: str) -> MovieSubtitlesAdminResponse:
    return MovieSubtitlesAdminResponse(
        movie_id=movie_id,
        original_language=subtitle_repository.get_movie_original_language(movie_id),
        available_subtitles=[
            build_available_subtitle_response(subtitle)
            for subtitle in subtitle_repository.list_movie_subtitles(movie_id)
        ],
        missing_languages=subtitle_repository.list_missing_subtitle_languages(movie_id),
    )


@router.post(
    "/admin/movies/{movie_id}/subtitles/generate",
    response_model=GenerateSubtitleResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def generate_movie_subtitle_for_admin(
    movie_id: str,
    payload: GenerateSubtitleRequest,
    background_tasks: BackgroundTasks,
) -> GenerateSubtitleResponse:
    target_language = payload.target_language.strip()
    source_language = (
        payload.source_language.strip()
        if payload.source_language
        else subtitle_repository.get_movie_original_language(movie_id)
    )
    if not source_language:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie original language was not found.",
        )

    original_subtitle = subtitle_repository.get_subtitle(movie_id, source_language)
    if not original_subtitle or original_subtitle.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original subtitle was not found for this movie and language.",
        )

    existing_subtitle = subtitle_repository.get_subtitle(movie_id, target_language)
    if existing_subtitle and existing_subtitle.status == "ready":
        return GenerateSubtitleResponse(
            movie_id=movie_id,
            source_language=source_language,
            target_language=target_language,
            status="ready",
            message="Subtitle already exists.",
        )

    subtitle_repository.mark_processing(movie_id, target_language)
    background_tasks.add_task(
        generate_translated_subtitle,
        movie_id,
        target_language,
        source_language,
    )
    return GenerateSubtitleResponse(
        movie_id=movie_id,
        source_language=source_language,
        target_language=target_language,
        status="processing",
        message="Subtitle generation was started in background.",
    )
