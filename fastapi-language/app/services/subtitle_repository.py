from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


@dataclass
class Language:
    id: int
    name: str


@dataclass
class Subtitle:
    id: int
    movie_id: str
    locale: str
    format: str
    file_path: str | None
    status: str
    subtitle_content: str | None = None


class InMemorySubtitleRepository:
    """
    Repositorio temporario do MVP.
    Substituir por banco quando o contrato estiver fechado.
    """

    def __init__(self) -> None:
        self._next_language_id = 1
        self._next_subtitle_id = 1
        self._languages: dict[str, Language] = {}
        self._subtitles: dict[tuple[str, str], Subtitle] = {}
        self._seed()

    def _seed(self) -> None:
        for language in ("en", "pt-BR", "es"):
            self.create_language(language)

        self.upsert_subtitle(
            movie_id="movie-001",
            locale="en",
            subtitle_format="srt",
            status="ready",
            subtitle_content=(
                "1\n"
                "00:00:01,000 --> 00:00:03,000\n"
                "Hello, welcome to the movie."
            ),
            file_path=None,
        )

    def create_language(self, name: str) -> Language:
        normalized = name.strip()
        existing = self._languages.get(normalized.lower())
        if existing:
            return existing

        language = Language(id=self._next_language_id, name=normalized)
        self._next_language_id += 1
        self._languages[normalized.lower()] = language
        return language

    def list_languages(self) -> list[Language]:
        return sorted(self._languages.values(), key=lambda language: language.name.lower())

    def get_subtitle(self, movie_id: str, locale: str) -> Subtitle | None:
        return self._subtitles.get((movie_id, locale))

    def get_original_subtitle(self, movie_id: str) -> Subtitle | None:
        subtitle = self.get_subtitle(movie_id, "en")
        if subtitle and subtitle.status == "ready":
            return subtitle
        return None

    def mark_processing(self, movie_id: str, locale: str) -> Subtitle:
        return self.upsert_subtitle(
            movie_id=movie_id,
            locale=locale,
            subtitle_format="srt",
            status="processing",
            subtitle_content=None,
            file_path=None,
        )

    def upsert_subtitle(
        self,
        movie_id: str,
        locale: str,
        subtitle_format: str,
        status: str,
        subtitle_content: str | None,
        file_path: str | None,
    ) -> Subtitle:
        key = (movie_id, locale)
        existing = self._subtitles.get(key)
        subtitle_id = existing.id if existing else self._next_subtitle_id
        if not existing:
            self._next_subtitle_id += 1

        subtitle = Subtitle(
            id=subtitle_id,
            movie_id=movie_id,
            locale=locale,
            format=subtitle_format,
            file_path=file_path,
            status=status,
            subtitle_content=subtitle_content,
        )
        self._subtitles[key] = subtitle
        return subtitle

    def load_subtitle_content(self, subtitle: Subtitle) -> str | None:
        if subtitle.subtitle_content:
            return subtitle.subtitle_content
        if not subtitle.file_path:
            return None

        output_file = settings.base_dir / Path(subtitle.file_path)
        if not output_file.exists():
            return None
        return output_file.read_text(encoding="utf-8")


subtitle_repository = InMemorySubtitleRepository()
