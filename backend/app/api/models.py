from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.models import ModelDetail, ModelSummary, RegisterModelRequest
from app.services.model_service import registry

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelSummary])
def list_models() -> list[dict]:
    return registry.list_models()


@router.get("/search", response_model=list[ModelSummary])
def search_models(q: str = Query(default="", min_length=0)) -> list[dict]:
    return registry.search(q)


@router.get("/tags", response_model=list[str])
def list_tags() -> list[str]:
    return registry.list_tags()


@router.get("/filter", response_model=list[ModelSummary])
def filter_models(
    tags: str = Query(default=""),
    plant: str = Query(default=""),
    disease: str = Query(default=""),
    tier: str = Query(default=""),
    status: str = Query(default=""),
) -> list[dict]:
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    return registry.filter_models(
        tags=tag_list or None,
        plant=plant or None,
        disease=disease or None,
        tier=tier or None,
        status=status or None,
    )


@router.get("/{model_id}", response_model=ModelDetail)
def get_model(model_id: str) -> dict:
    try:
        return registry.get_model_detail(model_id)
    except (FileNotFoundError, KeyError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/register", response_model=ModelSummary)
def register_model(payload: RegisterModelRequest) -> dict:
    try:
        return registry.register_model(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{model_id}/activate", response_model=ModelSummary)
def activate_model(model_id: str) -> dict:
    try:
        return registry.set_model_status(model_id, "active")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{model_id}/archive", response_model=ModelSummary)
def archive_model(model_id: str) -> dict:
    try:
        return registry.set_model_status(model_id, "archived")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{model_id}/metadata", response_model=ModelDetail)
def update_model_metadata(model_id: str, patch_data: dict[str, Any]) -> dict:
    try:
        return registry.update_model_metadata(model_id, patch_data)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
