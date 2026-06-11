from fastapi import APIRouter

from app.api.admin_subtitle_routes import router as admin_subtitle_router
from app.api.ai_routes import router as ai_router
from app.api.catalog_compat_routes import router as catalog_compat_router
from app.api.language_routes import router as language_router
from app.api.player_routes import router as player_router

router = APIRouter()
router.include_router(ai_router)
router.include_router(language_router)
router.include_router(admin_subtitle_router)
router.include_router(player_router)
router.include_router(catalog_compat_router)
