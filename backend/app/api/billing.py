from fastapi import APIRouter, HTTPException

from app.schemas.billing import UsageAccessResponse, UsageCheckRequest, UsageRecordRequest
from app.services.model_service import registry

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/pricing")
def list_pricing() -> list[dict]:
    return registry.list_pricing_tiers()


@router.post("/check-access", response_model=UsageAccessResponse)
def check_access(payload: UsageCheckRequest) -> dict:
    try:
        return registry.check_access(model_id=payload.model_id, user_id=payload.user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/record", response_model=UsageAccessResponse)
def record_usage(payload: UsageRecordRequest) -> dict:
    try:
        return registry.record_usage(
            model_id=payload.model_id,
            user_id=payload.user_id,
            count=payload.count,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
