from pydantic import BaseModel, Field, field_validator


class LanguageCreateRequest(BaseModel):
    """
    Contrato para cadastro de idioma aceito pelo sistema.
    Exemplo de locale: en-US, pt-BR, es-ES.
    """

    name: str = Field(..., min_length=2)
    code: str | None = Field(default=None, min_length=2)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("language name cannot be empty")
        return cleaned


class LanguageResponse(BaseModel):
    id: int
    name: str
    code: str


class MovieLanguageRequest(BaseModel):
    language: str = Field(..., min_length=2)

    @field_validator("language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("language cannot be empty")
        return cleaned


class MovieLanguageResponse(BaseModel):
    movie_id: str
    language: str


class UserLanguagesRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    languages: list[str] = Field(..., min_length=1)

    @field_validator("user_id")
    @classmethod
    def normalize_user_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("user_id cannot be empty")
        return cleaned

    @field_validator("languages")
    @classmethod
    def normalize_languages(cls, values: list[str]) -> list[str]:
        cleaned_values = [value.strip() for value in values if value.strip()]
        if not cleaned_values:
            raise ValueError("languages cannot be empty")
        return cleaned_values


class UserLanguagesResponse(BaseModel):
    user_id: str
    languages: list[str]
