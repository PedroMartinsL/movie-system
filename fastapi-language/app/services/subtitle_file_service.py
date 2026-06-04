from pathlib import Path

from app.core.config import settings


def save_translated_subtitle(
    movie_id: str,
    target_language: str,
    subtitle_content: str,
) -> str:
    """
    Salva a legenda traduzida em disco no diretorio de saida configurado.
    Retorna o caminho relativo usado na resposta da API.
    """

    # Nome padrao de arquivo para rastrear filme e idioma traduzido.
    file_name = f"{movie_id}_{target_language}.srt"
    output_path = settings.output_dir / file_name

    try:
        # Garante que o diretorio exista antes de gravar o arquivo.
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(subtitle_content, encoding="utf-8")
    except OSError as exc:
        raise IOError("Could not save translated subtitle file.") from exc

    # Caminho relativo padronizado para retorno no payload da API.
    relative_path = Path("storage") / "output" / file_name
    return str(relative_path).replace("\\", "/")
