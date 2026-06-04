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


# Instancia global de configuracao usada nos demais modulos.
settings = Settings()

