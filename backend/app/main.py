from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.benchmarks import router as benchmarks_router
from app.api.billing import router as billing_router
from app.api.models import router as models_router
from app.api.pages import router as pages_router
from app.api.predict import router as predict_router
from app.api.system import router as system_router
from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router
from app.core.settings import settings
from app.db.database import engine, Base, SessionLocal
from app.db import models
from app.services.model_service import registry
import json

Base.metadata.create_all(bind=engine)

# Seed database with Omni models
db = SessionLocal()
if not db.query(models.ModelCatalog).first():
    for model_summary in registry.list_models():
        meta = registry.get_model_detail(model_summary["model_id"])
        db_model = models.ModelCatalog(
            id=meta["model_id"],
            title=f"Omni {meta['name']} v{meta['version']}",
            description=meta.get("description", ""),
            artifact_path=meta.get("artifact_path", ""),
            input_spec=json.dumps(meta.get("input_spec", {})),
            output_classes=json.dumps(meta.get("class_names", [])),
            is_active=True,
            tags=json.dumps(meta.get("tags", []))
        )
        db.add(db_model)
    db.commit()
db.close()

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
app.include_router(auth_router)
app.include_router(models_router)
app.include_router(predict_router)
app.include_router(benchmarks_router)
app.include_router(billing_router)
app.include_router(chat_router)
app.include_router(analytics_router)


