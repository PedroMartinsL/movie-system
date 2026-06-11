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
        self._movie_original_languages: dict[str, str] = {}
        self._user_languages: dict[str, set[str]] = {}
        self._seed()

    def _seed(self) -> None:
        for language in ("en", "pt-BR", "es"):
            self.create_language(language)
        self.set_movie_original_language("movie-001", "en")

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

    def language_exists(self, name: str) -> bool:
        return name.strip().lower() in self._languages

    def set_movie_original_language(self, movie_id: str, language: str) -> str:
        normalized_language = language.strip()
        self.create_language(normalized_language)
        self._movie_original_languages[movie_id] = normalized_language
        return normalized_language

    def get_movie_original_language(self, movie_id: str) -> str | None:
        return self._movie_original_languages.get(movie_id)

    def set_user_languages(self, user_id: str, languages: list[str]) -> list[str]:
        normalized_languages = []
        for language in languages:
            normalized_language = language.strip()
            self.create_language(normalized_language)
            normalized_languages.append(normalized_language)

        self._user_languages[user_id] = set(normalized_languages)
        return self.list_user_languages(user_id)

    def list_user_languages(self, user_id: str) -> list[str]:
        return sorted(self._user_languages.get(user_id, set()), key=str.lower)

    def delete_user_language(self, user_id: str, language: str) -> bool:
        user_languages = self._user_languages.get(user_id)
        if not user_languages:
            return False

        normalized_lookup = language.strip().lower()
        matched_language = next(
            (
                known_language
                for known_language in user_languages
                if known_language.lower() == normalized_lookup
            ),
            None,
        )
        if not matched_language:
            return False

        user_languages.remove(matched_language)
        return True

    def list_movie_subtitles(self, movie_id: str) -> list[Subtitle]:
        subtitles = [
            subtitle
            for (subtitle_movie_id, _), subtitle in self._subtitles.items()
            if subtitle_movie_id == movie_id
        ]
        return sorted(subtitles, key=lambda subtitle: subtitle.locale.lower())

    def list_missing_subtitle_languages(self, movie_id: str) -> list[str]:
        available_locales = {
            subtitle.locale.lower()
            for subtitle in self.list_movie_subtitles(movie_id)
            if subtitle.status in {"ready", "processing"}
        }
        return [
            language.name
            for language in self.list_languages()
            if language.name.lower() not in available_locales
        ]

    def remove_movie_subtitles(self, movie_id: str) -> None:
        subtitle_keys = [
            key
            for key in self._subtitles
            if key[0] == movie_id
        ]
        for key in subtitle_keys:
            self._subtitles.pop(key, None)

        self._movie_original_languages.pop(movie_id, None)

    def get_subtitle(self, movie_id: str, locale: str) -> Subtitle | None:
        return self._subtitles.get((movie_id, locale))

    def get_original_subtitle(self, movie_id: str) -> Subtitle | None:
        original_language = self.get_movie_original_language(movie_id) or "en"
        subtitle = self.get_subtitle(movie_id, original_language)
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
