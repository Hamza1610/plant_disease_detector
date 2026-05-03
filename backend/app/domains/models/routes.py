import json
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.db import models
from app.db.models import UserRole
from app.domains.auth.services import require_role
from app.domains.models.repository import ModelRepository
from app.schemas.models import ModelDetail, ModelSummary, RegisterModelRequest
from app.core.settings import settings

router = APIRouter(prefix="/models", tags=["models"])

def _to_summary(model: models.Model) -> dict:
    return {
        "model_id": model.id,
        "name": model.name,
        "version": model.version or "v1",
        "status": model.status or "active",
        "description": model.description,
        "tags": json.loads(model.tags) if isinstance(model.tags, str) else (model.tags or []),
        "supported_plants": json.loads(model.supported_plants) if isinstance(model.supported_plants, str) else (model.supported_plants or []),
        "supported_diseases": json.loads(model.supported_diseases) if isinstance(model.supported_diseases, str) else (model.supported_diseases or []),
        "benchmark_summary": json.loads(model.benchmark_summary) if isinstance(model.benchmark_summary, str) else (model.benchmark_summary or {}),
        "pricing_tier": model.pricing_tier or "free"
    }

def _to_detail(model: models.Model) -> dict:
    summary = _to_summary(model)
    summary.update({
        "artifact_path": model.artifact_path,
        "framework": model.framework or "pytorch",
        "input_spec": json.loads(model.input_spec) if isinstance(model.input_spec, str) else (model.input_spec or {}),
        "output_spec": {}, # mock/computed
        "class_names": json.loads(model.output_classes) if isinstance(model.output_classes, str) else (model.output_classes or []),
    })
    return summary

@router.get("", response_model=List[ModelSummary])
def list_models(db: Session = Depends(get_db)):
    repo = ModelRepository(db)
    db_models = repo.list_all()
    return [_to_summary(m) for m in db_models]

@router.get("/search", response_model=List[ModelSummary])
def search_models(q: str = Query(default=""), db: Session = Depends(get_db)):
    repo = ModelRepository(db)
    db_models = repo.search(q)
    return [_to_summary(m) for m in db_models]

@router.get("/{model_id}", response_model=ModelDetail)
def get_model(model_id: str, db: Session = Depends(get_db)):
    repo = ModelRepository(db)
    db_model = repo.get_by_id(model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    return _to_detail(db_model)

@router.post("/upload", response_model=ModelDetail)
async def upload_model(
    file: UploadFile = File(...),
    model_id: str = Form(...),
    name: str = Form(...),
    description: str = Form(""),
    class_names: str = Form("[]"),
    tags: str = Form("[]"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.DEVELOPER, UserRole.ENTERPRISE]))
):
    # Ensure directory exists
    artifacts_dir = settings.models_artifacts_dir
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = artifacts_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    repo = ModelRepository(db)
    db_model = repo.create({
        "id": model_id,
        "owner_id": current_user.id,
        "name": name,
        "description": description,
        "artifact_path": str(file_path),
        "output_classes": class_names,
        "tags": tags,
        "framework": "pytorch",
        "status": "active"
    })
    return _to_detail(db_model)

@router.post("", response_model=ModelDetail)
def register_model(
    request: RegisterModelRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.DEVELOPER, UserRole.ENTERPRISE]))
):
    repo = ModelRepository(db)
    db_model = repo.create({
        "id": request.model_id,
        "owner_id": current_user.id,
        "name": request.name,
        "description": request.description,
        "version": request.version,
        "status": request.status,
        "artifact_path": request.metadata_file, # Wait, metadata_file vs artifact_path
        "tags": request.tags,
        "supported_plants": request.supported_plants,
        "supported_diseases": request.supported_diseases,
        "pricing_tier": request.pricing_tier,
        "benchmark_summary": request.benchmark_summary
    })
    return _to_detail(db_model)
