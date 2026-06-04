from pydantic import BaseModel, Field, field_validator


class SubtitleTranslationRequest(BaseModel):
    """
    Contrato de entrada para traducao de legenda.
    Define campos obrigatorios e formato aceito no MVP.
    """

    movie_id: str = Field(..., min_length=1)
    source_language: str = Field(..., min_length=1)
    target_language: str = Field(..., min_length=1)
    subtitle_content: str = Field(..., min_length=1)
    format: str = Field(default="srt")

    @field_validator("movie_id", "source_language", "target_language", "subtitle_content")
    @classmethod
    def validate_not_blank(cls, value: str) -> str:
        """
        Garante que campos textuais nao venham vazios ou apenas com espacos.
        """
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("field cannot be empty")
        return cleaned

    @field_validator("format")
    @classmethod
    def validate_format(cls, value: str) -> str:
        """
        Restringe o MVP para aceitar somente o formato SRT.
        """
        normalized = value.strip().lower()
        if normalized != "srt":
            raise ValueError("Only .srt format is supported in this MVP.")
        return normalized


class SubtitleTranslationResponse(BaseModel):
    """
    Contrato de saida com resultado da traducao e local do arquivo salvo.
    """

    movie_id: str
    source_language: str
    target_language: str
    format: str
    status: str
    translated_subtitle: str
    file_path: str


class HealthResponse(BaseModel):
    """
    Contrato de resposta do endpoint de health check.
    """

    status: str
    service: str
    message: str
