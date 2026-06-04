from fastapi import FastAPI

from app.api.routes import router as ai_router
from app.core.config import settings

# Inicializa a aplicacao FastAPI do microservico de IA.
app = FastAPI(title=settings.service_name)

# Registra as rotas com prefixo /ai definidas no modulo de API.
app.include_router(ai_router)
