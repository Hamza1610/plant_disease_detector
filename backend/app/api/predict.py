from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session
import json

from app.core.settings import settings
from app.inference.efficientnet_adapter import EfficientNetB0Adapter
from app.schemas.predict import PredictionResponse
from app.services.model_service import registry
from app.db.database import get_db
from app.db import models
from app.api.auth import get_current_user

router = APIRouter(prefix="/predict", tags=["predict"])

_ADAPTER_CACHE: dict[str, EfficientNetB0Adapter] = {}

def _get_adapter(model_id: str) -> EfficientNetB0Adapter:
    if model_id in _ADAPTER_CACHE:
        return _ADAPTER_CACHE[model_id]

    model_meta = registry.get_model_detail(model_id)
    artifact_name = Path(model_meta["artifact_path"]).name
    artifact_path = settings.models_artifacts_dir / artifact_name
    if not artifact_path.exists():
        raise FileNotFoundError(f"Artifact not found: {artifact_path}")

    adapter = EfficientNetB0Adapter(str(artifact_path), model_meta)
    _ADAPTER_CACHE[model_id] = adapter
    return adapter

@router.post("", response_model=PredictionResponse)
async def predict(
    image: UploadFile = File(...),
    model_id: str = Form(default=settings.default_model_id),
    top_k: int = Form(default=3),
    db: Session = Depends(get_db),
    # By making current_user optional, we allow unauthenticated users (if desired) or strict auth
    # The user asked for user-ready db auth: "user need to register it and everything his details are going to be saved"
    # We will enforce user authentication for predictions to save to their dashboard.
    current_user: models.User = Depends(get_current_user)
) -> dict:
    if image.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed.")

    try:
        adapter = _get_adapter(model_id)
        image_bytes = await image.read()
        predictions = adapter.predict_image_bytes(image_bytes, top_k=top_k)
    except (FileNotFoundError, KeyError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    # Log to Database
    pred_log = models.PredictionLog(
        user_id=current_user.id,
        model_id=model_id,
        image_filename=image.filename,
        predicted_class=predictions[0]["label"],
        confidence=predictions[0]["confidence"],
        full_result_json=json.dumps([p.dict() if hasattr(p, "dict") else p for p in predictions])
    )
    db.add(pred_log)
    db.commit()

    return {
        "model_id": model_id,
        "top_prediction": predictions[0],
        "predictions": predictions,
    }
@router.get("/history", response_model=list[PredictionResponse | dict]) # Using dict for simple mapping
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    history = db.query(models.PredictionLog).filter(models.PredictionLog.user_id == current_user.id).order_by(models.PredictionLog.created_at.desc()).all()
    
    # Simple mapping to match the frontend expectations if needed
    return [
        {
            "id": h.id,
            "model_id": h.model_id,
            "predicted_class": h.predicted_class,
            "confidence": h.confidence,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "image_filename": h.image_filename
        } for h in history
    ]
