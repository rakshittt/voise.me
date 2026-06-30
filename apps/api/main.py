import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.account import router as account_router
from routers.admin import router as admin_router
from routers.audit import router as audit_router
from routers.billing import router as billing_router
from routers.data_sources import router as data_sources_router
from routers.dna_match import router as dna_match_router
from routers.generation import router as generation_router
from routers.health import router as health_router
from routers.ideas import router as ideas_router
from routers.interaction import router as interaction_router
from routers.onboarding import router as onboarding_router
from routers.queue import router as queue_router
from routers.usage import router as usage_router
from routers.voice_profile import router as voice_profile_router
from routers.webhooks import router as webhooks_router
from services.cache import close_redis, init_redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis(settings.REDIS_URL)
    yield
    await close_redis()


_is_production = settings.ENVIRONMENT == "production"

app = FastAPI(
    title="Voise API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(account_router)
app.include_router(admin_router)
app.include_router(data_sources_router)
app.include_router(health_router)
app.include_router(onboarding_router)
app.include_router(voice_profile_router)
app.include_router(generation_router)
app.include_router(dna_match_router)
app.include_router(usage_router)
app.include_router(ideas_router)
app.include_router(queue_router)
app.include_router(interaction_router)
app.include_router(audit_router)
app.include_router(billing_router)
app.include_router(webhooks_router)
