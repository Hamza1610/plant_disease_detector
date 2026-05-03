from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.domains.billing.services import BillingService
from app.schemas.billing import UsageAccessResponse, UsageCheckRequest, UsageRecordRequest

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("/pricing")
def list_pricing(db: Session = Depends(get_db)):
    service = BillingService(db)
    return service.list_pricing_tiers()

@router.post("/check-access", response_model=UsageAccessResponse)
def check_access(payload: UsageCheckRequest, db: Session = Depends(get_db)):
    service = BillingService(db)
    try:
        return service.check_access(model_id=payload.model_id, user_id=payload.user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.post("/record", response_model=UsageAccessResponse)
def record_usage(payload: UsageRecordRequest, db: Session = Depends(get_db)):
    service = BillingService(db)
    try:
        return service.record_usage(model_id=payload.model_id, user_id=payload.user_id, count=payload.count)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
