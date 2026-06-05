from pydantic import BaseModel, Field, field_validator


class LanguageCreateRequest(BaseModel):
    """
    Contrato para cadastro de idioma aceito pelo sistema.
    Exemplo de locale: en-US, pt-BR, es-ES.
    """

    name: str = Field(..., min_length=2)

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
