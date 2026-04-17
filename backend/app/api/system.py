from fastapi import APIRouter

from app.core.settings import settings

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/info")
def info() -> dict[str, str]:
    return {"name": settings.app_name, "version": settings.app_version}
