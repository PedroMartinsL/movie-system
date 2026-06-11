from app.schemas.player_schema import AvailableSubtitleResponse, SubtitleStatusResponse
from app.services.subtitle_file_service import save_translated_subtitle
from app.services.subtitle_repository import Subtitle, subtitle_repository
from app.services.translation_service import translate_srt_subtitle


def build_subtitle_response(
    subtitle: Subtitle,
    include_content: bool,
    message: str | None = None,
) -> SubtitleStatusResponse:
    subtitle_content = None
    if include_content:
        subtitle_content = subtitle_repository.load_subtitle_content(subtitle)

    return SubtitleStatusResponse(
        id=subtitle.id,
        movie_id=subtitle.movie_id,
        locale=subtitle.locale,
        format=subtitle.format,
        file_path=subtitle.file_path,
        status=subtitle.status,
        subtitle_content=subtitle_content,
        message=message,
    )


def build_available_subtitle_response(subtitle: Subtitle) -> AvailableSubtitleResponse:
    return AvailableSubtitleResponse(
        id=subtitle.id,
        movie_id=subtitle.movie_id,
        locale=subtitle.locale,
        format=subtitle.format,
        file_path=subtitle.file_path,
        status=subtitle.status,
    )


def generate_translated_subtitle(
    movie_id: str,
    target_language: str,
    source_language: str | None = None,
) -> None:
    original = (
        subtitle_repository.get_subtitle(movie_id, source_language)
        if source_language
        else subtitle_repository.get_original_subtitle(movie_id)
    )
    if not original:
        return

    original_content = subtitle_repository.load_subtitle_content(original)
    if not original_content:
        return

    translated_subtitle = translate_srt_subtitle(
        subtitle_content=original_content,
        source_language=original.locale,
        target_language=target_language,
    )
    file_path = save_translated_subtitle(
        movie_id=movie_id,
        target_language=target_language,
        subtitle_content=translated_subtitle,
    )
    subtitle_repository.upsert_subtitle(
        movie_id=movie_id,
        locale=target_language,
        subtitle_format="srt",
        status="ready",
        subtitle_content=translated_subtitle,
        file_path=file_path,
    )
