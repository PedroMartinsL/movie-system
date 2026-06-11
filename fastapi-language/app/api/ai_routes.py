from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.schemas.player_schema import TranscribeRequest, TranscribeResponse
from app.schemas.subtitle_schema import (
    HealthResponse,
    SubtitleTranslationRequest,
    SubtitleTranslationResponse,
)
from app.services.subtitle_file_service import save_translated_subtitle
from app.services.subtitle_repository import subtitle_repository
from app.services.media_transcription_service import (
    MediaTranscriptionError,
    transcribe_media_upload,
)
from app.services.translation_service import TranslationServiceError, translate_srt_subtitle

router = APIRouter(tags=["ai"])


@router.get("/ai/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        message="AI service is running",
    )


@router.post("/ai/translate-subtitle", response_model=SubtitleTranslationResponse)
def translate_subtitle(
    payload: SubtitleTranslationRequest,
) -> SubtitleTranslationResponse:
    try:
        translated_subtitle = translate_srt_subtitle(
            subtitle_content=payload.subtitle_content,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
        file_path = save_translated_subtitle(
            movie_id=payload.movie_id,
            target_language=payload.target_language,
            subtitle_content=translated_subtitle,
        )

        return SubtitleTranslationResponse(
            movie_id=payload.movie_id,
            source_language=payload.source_language,
            target_language=payload.target_language,
            format="srt",
            status="success",
            translated_subtitle=translated_subtitle,
            file_path=file_path,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except IOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except TranslationServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected internal error.",
        ) from exc


@router.post("/ai/transcribe", response_model=TranscribeResponse)
def transcribe_or_translate(payload: TranscribeRequest) -> TranscribeResponse:
    if payload.format.strip().lower() != "srt":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .srt format is supported in this MVP.",
        )

    if payload.subtitle_content and payload.target_language:
        try:
            subtitle_content = translate_srt_subtitle(
                subtitle_content=payload.subtitle_content,
                source_language=payload.source_language,
                target_language=payload.target_language,
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc
        except TranslationServiceError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        file_path = save_translated_subtitle(
            movie_id=payload.movie_id,
            target_language=payload.target_language,
            subtitle_content=subtitle_content,
        )
        subtitle_repository.upsert_subtitle(
            movie_id=payload.movie_id,
            locale=payload.target_language,
            subtitle_format="srt",
            status="ready",
            subtitle_content=subtitle_content,
            file_path=file_path,
        )
        return TranscribeResponse(
            movie_id=payload.movie_id,
            source_language=payload.source_language,
            target_language=payload.target_language,
            format="srt",
            status="ready",
            subtitle_content=subtitle_content,
            file_path=file_path,
        )

    subtitle_content = (
        "1\n"
        "00:00:01,000 --> 00:00:03,000\n"
        "Generated subtitle from audio."
    )
    subtitle_repository.upsert_subtitle(
        movie_id=payload.movie_id,
        locale=payload.source_language,
        subtitle_format="srt",
        status="ready",
        subtitle_content=subtitle_content,
        file_path=None,
    )
    return TranscribeResponse(
        movie_id=payload.movie_id,
        source_language=payload.source_language,
        target_language=payload.target_language,
        format="srt",
        status="ready",
        subtitle_content=subtitle_content,
        file_path=None,
    )


@router.post("/ai/transcribe-file", response_model=TranscribeResponse)
def transcribe_file(
    movie_id: str = Form(...),
    source_language: str = Form("en"),
    file: UploadFile = File(...),
) -> TranscribeResponse:
    try:
        subtitle_content = transcribe_media_upload(file, source_language)
        file_path = save_translated_subtitle(
            movie_id=movie_id,
            target_language=source_language,
            subtitle_content=subtitle_content,
        )
    except MediaTranscriptionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except IOError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    subtitle_repository.set_movie_original_language(movie_id, source_language)
    subtitle_repository.upsert_subtitle(
        movie_id=movie_id,
        locale=source_language,
        subtitle_format="srt",
        status="ready",
        subtitle_content=subtitle_content,
        file_path=file_path,
    )
    return TranscribeResponse(
        movie_id=movie_id,
        source_language=source_language,
        target_language=None,
        format="srt",
        status="ready",
        subtitle_content=subtitle_content,
        file_path=file_path,
        source_media=file.filename,
    )
