from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import models
from typing import List, Dict, Any

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_global_summary(self) -> Dict[str, Any]:
        total_scans = self.db.query(func.count(models.PredictionLog.id)).scalar()
        total_users = self.db.query(func.count(models.User.id)).scalar()
        avg_confidence = self.db.query(func.avg(models.PredictionLog.confidence)).scalar() or 0.0
        
        # Top 5 diseases
        top_diseases = self.db.query(
            models.PredictionLog.predicted_class,
            func.count(models.PredictionLog.id).label('count')
        ).group_by(models.PredictionLog.predicted_class)\
         .order_by(func.count(models.PredictionLog.id).desc())\
         .limit(5).all()

        return {
            "total_scans": total_scans,
            "total_users": total_users,
            "average_confidence": round(float(avg_confidence) * 100, 1),
            "top_diseases": [{"label": d[0], "count": d[1]} for d in top_diseases]
        }

    def get_developer_summary(self, developer_id: str) -> Dict[str, Any]:
        total_scans = self.db.query(func.count(models.PredictionLog.id))\
            .join(models.Model, models.PredictionLog.model_id == models.Model.id)\
            .filter(models.Model.owner_id == developer_id).scalar() or 0

        avg_confidence = self.db.query(func.avg(models.PredictionLog.confidence))\
            .join(models.Model, models.PredictionLog.model_id == models.Model.id)\
            .filter(models.Model.owner_id == developer_id).scalar() or 0.0

        active_models_count = self.db.query(func.count(models.Model.id))\
            .filter(models.Model.owner_id == developer_id, models.Model.status == "active").scalar() or 0

        return {
            "total_scans": total_scans,
            "active_models": active_models_count,
            "average_confidence": round(float(avg_confidence) * 100, 1)
        }

    def get_geospatial_stats(self) -> List[Dict[str, Any]]:
        stats = self.db.query(
            models.PredictionLog.region,
            models.PredictionLog.country,
            func.count(models.PredictionLog.id).label('count')
        ).group_by(models.PredictionLog.region, models.PredictionLog.country)\
         .order_by(func.count(models.PredictionLog.id).desc()).all()

        return [
            {
                "region": s[0] or "Unknown",
                "country": s[1] or "Unknown",
                "count": s[2]
            } for s in stats
        ]

    def get_pathogen_trends(self) -> List[Dict[str, Any]]:
        # Weekly trends for the last 4 weeks
        # Simplified for now: just count by class
        trends = self.db.query(
            models.PredictionLog.predicted_class,
            func.count(models.PredictionLog.id).label('count')
        ).group_by(models.PredictionLog.predicted_class).all()
        
        return [
            {
                "disease": t[0],
                "count": t[1]
            } for t in trends
        ]
