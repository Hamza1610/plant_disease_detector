from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.settings import settings
from app.inference.efficientnet_adapter import EfficientNetB0Adapter
from app.schemas.predict import PredictionResponse
from app.services.model_service import registry

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
) -> dict:
    if image.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed.")

    try:
        adapter = _get_adapter(model_id)
        image_bytes = await image.read()
        predictions = adapter.predict_image_bytes(image_bytes, top_k=top_k)
    except (FileNotFoundError, KeyError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    return {
        "model_id": model_id,
        "top_prediction": predictions[0],
        "predictions": predictions,
    }
