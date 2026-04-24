from typing import Any
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
import json

from app.schemas.models import ModelDetail, ModelSummary, RegisterModelRequest
from app.db.database import get_db
from app.db import models

from app.api.auth import require_role
from app.db.models import UserRole

router = APIRouter(prefix="/models", tags=["models"])

@router.post("", response_model=ModelDetail)
def register_model(
    request: RegisterModelRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.DEVELOPER, UserRole.ENTERPRISE]))
):
    db_model = models.ModelCatalog(
        id=request.model_id,
        owner_id=current_user.id,
        title=request.name,
        description=request.description,
        artifact_path=request.artifact_path,
        input_spec=json.dumps(request.input_spec) if request.input_spec else "{}",
        output_classes=json.dumps(request.class_names) if request.class_names else "[]",
        tags=json.dumps(request.tags) if request.tags else "[]",
        is_active=True
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return _to_detail(db_model)

def _to_summary(model: models.ModelCatalog) -> dict:
    return {
        "model_id": model.id,
        "name": model.title,
        "version": "v1",
        "status": "active" if model.is_active else "archived",
        "description": model.description,
        "tags": json.loads(model.tags) if model.tags else [],
        "supported_plants": [],        # Schema compliance
        "supported_diseases": [],      # Schema compliance
        "benchmark_summary": {},       # Schema compliance
        "pricing_tier": "free"
    }

def _to_detail(model: models.ModelCatalog) -> dict:
    summary = _to_summary(model)
    # The frontend expects certain fields like input_spec, outputs, etc.
    summary.update({
        "supported_plants": ["multiple"],
        "supported_diseases": ["multiple"],
        "artifact_path": model.artifact_path,
        "input_spec": json.loads(model.input_spec) if model.input_spec else {},
        "output_spec": {}, # mock
        "class_names": json.loads(model.output_classes) if model.output_classes else []
    })
    return summary

@router.get("", response_model=list[ModelSummary])
def list_models(db: Session = Depends(get_db)) -> list[dict]:
    db_models = db.query(models.ModelCatalog).all()
    # In case DB is empty but we have it seeded in registry, we should fetch from DB
    return [_to_summary(m) for m in db_models]

@router.get("/search", response_model=list[ModelSummary])
def search_models(q: str = Query(default="", min_length=0), db: Session = Depends(get_db)) -> list[dict]:
    # Very basic search implementation
    db_models = db.query(models.ModelCatalog).filter(models.ModelCatalog.title.ilike(f"%{q}%")).all()
    return [_to_summary(m) for m in db_models]

@router.get("/{model_id}", response_model=ModelDetail)
def get_model(model_id: str, db: Session = Depends(get_db)) -> dict:
    db_model = db.query(models.ModelCatalog).filter(models.ModelCatalog.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    return _to_detail(db_model)
