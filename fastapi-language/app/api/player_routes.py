from fastapi import APIRouter, BackgroundTasks, HTTPException, Response, status

from app.api.subtitle_tasks import build_subtitle_response, generate_translated_subtitle
from app.core.config import settings
from app.schemas.player_schema import ManifestResponse, SubtitleStatusResponse
from app.services.subtitle_repository import subtitle_repository

router = APIRouter(tags=["player"])


@router.get("/player/{title_id}/manifest", response_model=ManifestResponse)
def get_manifest(title_id: str) -> ManifestResponse:
    manifest_url = f"{settings.storage_base_url}/movies/{title_id}/manifest.m3u8"
    return ManifestResponse(
        movie_id=title_id,
        status="ready",
        streaming_format="HLS",
        manifest_url=manifest_url,
        secure_url=f"{manifest_url}?token=mock-secure-token",
    )


@router.get("/player/{title_id}/subtitles", response_model=SubtitleStatusResponse)
def get_subtitle(
    title_id: str,
    lang: str,
    background_tasks: BackgroundTasks,
    response: Response,
) -> SubtitleStatusResponse:
    subtitle = subtitle_repository.get_subtitle(title_id, lang)
    if subtitle and subtitle.status == "ready":
        return build_subtitle_response(subtitle, include_content=True)

    if subtitle and subtitle.status == "processing":
        response.status_code = status.HTTP_202_ACCEPTED
        return build_subtitle_response(
            subtitle,
            include_content=False,
            message="Subtitle generation is still processing.",
        )

    original = subtitle_repository.get_original_subtitle(title_id)
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original SRT subtitle was not found for this movie.",
        )

    processing_subtitle = subtitle_repository.mark_processing(title_id, lang)
    background_tasks.add_task(generate_translated_subtitle, title_id, lang)
    response.status_code = status.HTTP_202_ACCEPTED
    return build_subtitle_response(
        processing_subtitle,
        include_content=False,
        message="Subtitle was not found. Generation was started in background.",
    )
