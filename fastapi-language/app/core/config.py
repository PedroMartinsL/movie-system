import os
from pathlib import Path

from dotenv import load_dotenv

# Carrega variaveis definidas no arquivo .env.
load_dotenv()


class Settings:
	"""
	Centraliza configuracoes do microservico.
	Mantem valores default para rodar o MVP sem dependencias externas.
	"""

	def __init__(self) -> None:
		# Diretório base do projeto fastapi-language.
		self.base_dir = Path(__file__).resolve().parents[2]
		# Nome exibido no servico e no health check.
		self.service_name = os.getenv("SERVICE_NAME", "ai-service")

		# Diretorio onde arquivos traduzidos sao salvos localmente.
		configured_output_dir = os.getenv("OUTPUT_DIR", "storage/output")
		self.output_dir = (self.base_dir / configured_output_dir).resolve()
		self.storage_base_url = os.getenv("STORAGE_BASE_URL", "http://storage-spring:8080")
		self.ai_provider = os.getenv("AI_PROVIDER", "mock").strip().lower()
		self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
		self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
		self.ollama_timeout_seconds = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "60"))
		self.media_work_dir = (self.base_dir / os.getenv("MEDIA_WORK_DIR", "storage/work")).resolve()
		self.ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")
		self.whisper_model = os.getenv("WHISPER_MODEL", "base")
		self.whisper_device = os.getenv("WHISPER_DEVICE", "cpu")
		self.whisper_compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")


# Instancia global de configuracao usada nos demais modulos.
settings = Settings()

