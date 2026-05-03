from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.domains.auth.routes import router as auth_router
from app.domains.models.routes import router as models_router
from app.domains.inference.routes import router as predict_router
from app.domains.billing.routes import router as billing_router
from app.domains.analytics.routes import router as analytics_router
from app.domains.benchmarks.routes import router as benchmarks_router
from app.domains.chat.routes import router as chat_router
from app.domains.system.routes import router as system_router

from app.core.settings import settings
from app.infrastructure.initialization import init_db, seed_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database on startup
    init_db()
    seed_db()
    yield

app = FastAPI(
    title=settings.app_name, 
    version=settings.app_version,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(settings.workspace_root / "backend" / "static")), name="static")

# New Domain-Driven Routers
app.include_router(auth_router)
app.include_router(models_router)
app.include_router(predict_router)
app.include_router(billing_router)
app.include_router(analytics_router)
app.include_router(benchmarks_router)
app.include_router(chat_router)
app.include_router(system_router)


