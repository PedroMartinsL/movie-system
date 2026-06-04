from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.schemas.subtitle_schema import (
	HealthResponse,
	SubtitleTranslationRequest,
	SubtitleTranslationResponse,
)
from app.services.subtitle_file_service import save_translated_subtitle
from app.services.translation_service import translate_srt_subtitle

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/health", response_model=HealthResponse)
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


@router.post("/translate-subtitle", response_model=SubtitleTranslationResponse)
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

