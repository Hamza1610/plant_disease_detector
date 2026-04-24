from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.db.database import get_db
from app.db import models
from app.api.auth import require_role
from app.db.models import UserRole

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", dependencies=[Depends(require_role([UserRole.ENTERPRISE, UserRole.DEVELOPER]))])
def get_global_summary(db: Session = Depends(get_db)):
    """Get high-level statistics across all users."""
    total_scans = db.query(models.PredictionLog).count()
    total_users = db.query(models.User).count()
    
    # Average confidence
    avg_confidence = db.query(func.avg(models.PredictionLog.confidence)).scalar() or 0
    
    # Top 3 most detected diseases
    top_diseases = db.query(
        models.PredictionLog.predicted_class, 
        func.count(models.PredictionLog.id).label('count')
    ).group_by(models.PredictionLog.predicted_class).order_by(func.count(models.PredictionLog.id).desc()).limit(3).all()

    return {
        "total_scans": total_scans,
        "total_users": total_users,
        "average_confidence": round(float(avg_confidence) * 100, 2),
        "top_diseases": [{"label": d[0], "count": d[1]} for d in top_diseases]
    }

@router.get("/trends", dependencies=[Depends(require_role([UserRole.ENTERPRISE, UserRole.DEVELOPER]))])
def get_detection_trends(days: int = 7, db: Session = Depends(get_db)):
    """Get detection frequency over the last X days."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    trends = db.query(
        func.date(models.PredictionLog.created_at).label('date'),
        func.count(models.PredictionLog.id).label('count')
    ).filter(models.PredictionLog.created_at >= start_date).group_by(func.date(models.PredictionLog.created_at)).order_by(func.date(models.PredictionLog.created_at)).all()

    return [{"date": str(t[0]), "count": t[1]} for t in trends]

@router.get("/model-performance", dependencies=[Depends(require_role([UserRole.ENTERPRISE, UserRole.DEVELOPER]))])
def get_model_performance(db: Session = Depends(get_db)):
    """Compare performance across different models."""
    perf = db.query(
        models.PredictionLog.model_id,
        func.count(models.PredictionLog.id).label('scans'),
        func.avg(models.PredictionLog.confidence).label('avg_confidence')
    ).group_by(models.PredictionLog.model_id).all()

    return [
        {
            "model_id": p[0], 
            "scans": p[1], 
            "avg_confidence": round(float(p[2]) * 100, 2)
        } for p in perf
    ]
