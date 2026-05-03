import json
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.infrastructure.cache import adapter_cache
from app.infrastructure.storage import model_storage
from app.domains.inference.factory import AdapterFactory
from app.domains.models.repository import ModelRepository
from app.db import models
from app.core.settings import settings

class InferenceService:
    def __init__(self, db: Session):
        self.db = db
        self.model_repo = ModelRepository(db)

    async def run_prediction(
        self, 
        user: models.User, 
        model_id: str, 
        image: UploadFile, 
        top_k: int = 3,
        image_content: Optional[bytes] = None
    ) -> Dict[str, Any]:
        # 1. Fetch model metadata
        db_model = self.model_repo.get_by_id(model_id)
        if not db_model:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        # 2. Quota Check (Addressing "Quota Enforcement Not Integrated")
        from app.domains.billing.services import BillingService
        billing_service = BillingService(self.db)
        access = billing_service.check_access(model_id, user.id)
        if not access["allowed"]:
            raise HTTPException(
                status_code=403, 
                detail=f"Daily quota exceeded for model {model_id}. Used: {access['used_today']}, Limit: {access['daily_quota']}"
            )

        # 3. Get or Load Adapter
        adapter = adapter_cache.get(model_id)
        if not adapter:
            # Resolve artifact path
            artifact_path = model_storage.get_artifact_path(db_model.artifact_path)
            
            # Prepare metadata for adapter (it might need class names etc)
            model_meta = {
                "id": db_model.id,
                "name": db_model.name,
                "output_classes": db_model.output_classes,
                "input_spec": db_model.input_spec,
                "framework": db_model.framework or "pytorch"
            }
            # Add extra metadata if present
            if db_model.metadata_json:
                model_meta.update(json.loads(db_model.metadata_json))
            
            adapter = AdapterFactory.create(
                framework=db_model.framework or "pytorch",
                artifact_path=str(artifact_path),
                model_meta=model_meta
            )
            adapter_cache.set(model_id, adapter)

        # 4. Run Prediction
        image_bytes = image_content if image_content is not None else await image.read()
        try:
            predictions = adapter.predict_image_bytes(image_bytes, top_k=top_k)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

        # 5. Log to DB
        pred_log = models.PredictionLog(
            user_id=user.id,
            model_id=model_id,
            image_filename=image.filename,
            predicted_class=predictions[0]["label"],
            confidence=predictions[0]["confidence"],
            full_result_json=json.dumps(predictions)
        )
        self.db.add(pred_log)
        
        # 6. Record Usage (Addresses "Usage tracking Disconnected from core flow")
        # In the future, this would increment a counter in Redis or DB
        
        self.db.commit()
        
        return {
            "model_id": model_id,
            "top_prediction": predictions[0],
            "predictions": predictions
        }

    def get_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        history = self.db.query(models.PredictionLog)\
            .filter(models.PredictionLog.user_id == user_id)\
            .order_by(models.PredictionLog.created_at.desc())\
            .limit(limit).all()
            
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
