from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

router = APIRouter(tags=["pages"])


@router.get("/", response_class=HTMLResponse)
def landing_page(request: Request):
    return templates.TemplateResponse(request=request, name="pages/landing.html")


@router.get("/app/models", response_class=HTMLResponse)
def models_page(request: Request):
    return templates.TemplateResponse(request=request, name="pages/models.html")


@router.get("/app/models/{model_id}", response_class=HTMLResponse)
def model_detail_page(request: Request, model_id: str):
    return templates.TemplateResponse(
        request=request,
        name="pages/model_detail.html",
        context={"model_id": model_id},
    )


@router.get("/app/predict", response_class=HTMLResponse)
def predict_page(request: Request):
    return templates.TemplateResponse(request=request, name="pages/predict.html")


@router.get("/app/benchmarks", response_class=HTMLResponse)
def benchmarks_page(request: Request):
    return templates.TemplateResponse(request=request, name="pages/benchmarks.html")


@router.get("/app/pricing", response_class=HTMLResponse)
def pricing_page(request: Request):
    return templates.TemplateResponse(request=request, name="pages/pricing.html")
