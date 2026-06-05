from fastapi import APIRouter, BackgroundTasks, HTTPException, Response, status

from app.core.config import settings
from app.schemas.language_schema import LanguageCreateRequest, LanguageResponse
from app.schemas.player_schema import (
	ManifestResponse,
	SubtitleStatusResponse,
	TranscribeRequest,
	TranscribeResponse,
)
from app.schemas.subtitle_schema import (
	HealthResponse,
	SubtitleTranslationRequest,
	SubtitleTranslationResponse,
)
from app.services.subtitle_file_service import save_translated_subtitle
from app.services.subtitle_repository import Subtitle, subtitle_repository
from app.services.translation_service import translate_srt_subtitle

router = APIRouter()


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


def generate_translated_subtitle(movie_id: str, target_language: str) -> None:
	original = subtitle_repository.get_original_subtitle(movie_id)
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


@router.get("/ai/health", response_model=HealthResponse, tags=["ai"])
def health_check() -> HealthResponse:
	"""
	Endpoint de verificacao de saude do servico.
	Retorna status simples para confirmar que a API esta online.
	"""
	return HealthResponse(
		status="ok",
		service=settings.service_name,
		message="AI service is running",
	)


@router.post("/ai/translate-subtitle", response_model=SubtitleTranslationResponse, tags=["ai"])
def translate_subtitle(
	payload: SubtitleTranslationRequest,
) -> SubtitleTranslationResponse:
	"""
	Recebe uma legenda SRT, traduz somente as linhas de texto
	e salva o resultado em arquivo local.
	"""
	try:
		# Aplica a traducao mockada preservando estrutura de blocos SRT.
		translated_subtitle = translate_srt_subtitle(
			subtitle_content=payload.subtitle_content,
			source_language=payload.source_language,
			target_language=payload.target_language,
		)

		# Persiste a legenda traduzida no diretorio local configurado.
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
		# Erros de validacao de entrada e formato retornam 400.
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=str(exc),
		) from exc
	except IOError as exc:
		# Falha de escrita de arquivo retorna 500.
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=str(exc),
		) from exc
	except Exception as exc:
		# Fallback para qualquer erro nao mapeado explicitamente.
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Unexpected internal error.",
		) from exc


@router.post("/ai/transcribe", response_model=TranscribeResponse, tags=["ai"])
def transcribe_or_translate(payload: TranscribeRequest) -> TranscribeResponse:
	"""
	Mock do endpoint de IA.
	Se receber subtitle_content, traduz a legenda existente.
	Se nao receber, simula uma transcricao SRT gerada a partir de audio.
	"""
	if payload.format.strip().lower() != "srt":
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Only .srt format is supported in this MVP.",
		)

	if payload.subtitle_content and payload.target_language:
		subtitle_content = translate_srt_subtitle(
			subtitle_content=payload.subtitle_content,
			source_language=payload.source_language,
			target_language=payload.target_language,
		)
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


@router.post("/idioma/", response_model=LanguageResponse, status_code=status.HTTP_201_CREATED, tags=["idiomas"])
def create_language(payload: LanguageCreateRequest) -> LanguageResponse:
	language = subtitle_repository.create_language(payload.name)
	return LanguageResponse(id=language.id, name=language.name)


@router.get("/idiomas/", response_model=list[LanguageResponse], tags=["idiomas"])
def list_languages() -> list[LanguageResponse]:
	return [
		LanguageResponse(id=language.id, name=language.name)
		for language in subtitle_repository.list_languages()
	]


@router.get("/player/{title_id}/manifest", response_model=ManifestResponse, tags=["player"])
def get_manifest(title_id: str) -> ManifestResponse:
	manifest_url = f"{settings.storage_base_url}/movies/{title_id}/manifest.m3u8"
	return ManifestResponse(
		movie_id=title_id,
		status="ready",
		streaming_format="HLS",
		manifest_url=manifest_url,
		secure_url=f"{manifest_url}?token=mock-secure-token",
	)


@router.get("/player/{title_id}/subtitles", response_model=SubtitleStatusResponse, tags=["player"])
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

