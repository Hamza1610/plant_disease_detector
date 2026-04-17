from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.benchmarks import router as benchmarks_router
from app.api.billing import router as billing_router
from app.api.models import router as models_router
from app.api.pages import router as pages_router
from app.api.predict import router as predict_router
from app.api.system import router as system_router
from app.core.settings import settings

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(settings.workspace_root / "backend" / "static")), name="static")

app.include_router(pages_router)
app.include_router(system_router)
app.include_router(models_router)
app.include_router(predict_router)
app.include_router(benchmarks_router)
app.include_router(billing_router)
