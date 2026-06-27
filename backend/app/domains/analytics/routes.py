from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.domains.analytics.services import AnalyticsService
from app.domains.auth.services import require_role
from app.db.models import UserRole

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    # Only Enterprise and Developers can see full global analytics
    current_user = Depends(require_role([UserRole.ENTERPRISE, UserRole.DEVELOPER]))
):
    service = AnalyticsService(db)
    return service.get_global_summary()

@router.get("/developer/summary")
def get_developer_analytics_summary(
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.DEVELOPER]))
):
    service = AnalyticsService(db)
    return service.get_developer_summary(current_user.id)

@router.get("/geospatial")
def get_geospatial_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ENTERPRISE]))
):
    service = AnalyticsService(db)
    return service.get_geospatial_stats()

@router.get("/trends")
def get_pathogen_trends(
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ENTERPRISE]))
):
    service = AnalyticsService(db)
    return service.get_pathogen_trends()
