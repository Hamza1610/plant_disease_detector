import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import models

class BillingService:
    def __init__(self, db: Session):
        self.db = db

    def list_pricing_tiers(self) -> List[Dict[str, Any]]:
        tiers = self.db.query(models.PricingTier).all()
        return [
            {
                "tier": t.tier,
                "daily_quota": t.daily_quota,
                "features": json.loads(t.features) if t.features else []
            } for t in tiers
        ]

    def check_access(self, model_id: str, user_id: str) -> Dict[str, Any]:
        # 1. Get model and its tier
        db_model = self.db.query(models.Model).filter(models.Model.id == model_id).first()
        if not db_model:
            raise KeyError(f"Model {model_id} not found")
        
        tier_name = db_model.pricing_tier or "free"
        
        # 2. Get tier quota
        tier = self.db.query(models.PricingTier).filter(models.PricingTier.tier == tier_name).first()
        quota = tier.daily_quota if tier else 200 # fallback
        
        # 3. Calculate usage today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        used = self.db.query(func.count(models.PredictionLog.id)).filter(
            models.PredictionLog.user_id == user_id,
            models.PredictionLog.model_id == model_id,
            models.PredictionLog.created_at >= today_start
        ).scalar() or 0
        
        allowed = quota < 0 or used < quota
        
        return {
            "model_id": model_id,
            "user_id": user_id,
            "pricing_tier": tier_name,
            "daily_quota": quota,
            "used_today": used,
            "allowed": allowed,
            "remaining": -1 if quota < 0 else max(quota - used, 0),
        }

    def record_usage(self, model_id: str, user_id: str, count: int = 1) -> Dict[str, Any]:
        # PredictionLog already serves as usage record
        return self.check_access(model_id, user_id)
