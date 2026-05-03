from fastapi import APIRouter, File, Form, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.db import models
from app.domains.auth.services import get_current_user
from app.domains.inference.services import InferenceService
from app.schemas.predict import PredictionResponse
from app.core.settings import settings

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("", response_model=PredictionResponse)
async def predict(
    image: UploadFile = File(...),
    model_id: str = Form(default=settings.default_model_id),
    top_k: int = Form(default=3),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Basic Validation
    if image.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed.")

    # Size Validation (5MB limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    image_size = 0
    content = await image.read()
    image_size = len(content)
    if image_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
    
    # Seek back to start after reading
    import io
    from starlette.datastructures import UploadFile as StarletteUploadFile
    # Since we already read it, we can pass the bytes or wrap it back.
    # Actually, InferenceService.run_prediction reads it again.
    # I'll modify run_prediction to accept bytes or use a better way.
    
    service = InferenceService(db)
    # Re-wrap content for the service if needed, or just pass content
    # I'll update InferenceService to accept bytes.
    return await service.run_prediction(
        user=current_user,
        model_id=model_id,
        image=image, # This will be tricky if already read
        top_k=top_k,
        image_content=content
    )

@router.get("/history")
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    service = InferenceService(db)
    return service.get_history(user_id=current_user.id)
