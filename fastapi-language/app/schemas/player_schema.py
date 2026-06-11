from pydantic import BaseModel


class ManifestResponse(BaseModel):
    movie_id: str
    status: str
    streaming_format: str
    manifest_url: str
    secure_url: str


class SubtitleStatusResponse(BaseModel):
    id: int
    movie_id: str
    locale: str
    format: str
    file_path: str | None
    status: str
    subtitle_content: str | None = None
    message: str | None = None


class AvailableSubtitleResponse(BaseModel):
    id: int
    movie_id: str
    locale: str
    format: str
    file_path: str | None
    status: str


class MovieSubtitlesAdminResponse(BaseModel):
    movie_id: str
    original_language: str | None
    available_subtitles: list[AvailableSubtitleResponse]
    missing_languages: list[str]


class GenerateSubtitleRequest(BaseModel):
    target_language: str
    source_language: str | None = None


class GenerateSubtitleResponse(BaseModel):
    movie_id: str
    source_language: str
    target_language: str
    status: str
    message: str


class TranscribeRequest(BaseModel):
    movie_id: str
    source_language: str = "en"
    target_language: str | None = None
    subtitle_content: str | None = None
    format: str = "srt"


class TranscribeResponse(BaseModel):
    movie_id: str
    source_language: str
    target_language: str | None
    format: str
    status: str
    subtitle_content: str
    file_path: str | None = None
    source_media: str | None = None
