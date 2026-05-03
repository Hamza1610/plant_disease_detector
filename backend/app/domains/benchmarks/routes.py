from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.db import models
from app.schemas.benchmarks import BenchmarkRunRequest, BenchmarkRunResponse
from app.domains.benchmarks.services import run_benchmark as run_benchmark_job

router = APIRouter(prefix="/benchmarks", tags=["benchmarks"])

def _to_response(b: models.Benchmark) -> dict:
    return {
        "run_id": str(b.id),
        "model_id": b.model_id,
        "dataset": b.dataset,
        "accuracy": round(b.accuracy, 4) if b.accuracy else 0.0,
        "precision_weighted": round(b.precision_weighted, 4) if b.precision_weighted else 0.0,
        "recall_weighted": round(b.recall_weighted, 4) if b.recall_weighted else 0.0,
        "f1_weighted": round(b.f1_weighted, 4) if b.f1_weighted else 0.0,
        "latency_ms_p50": round(b.latency_ms_p50, 2) if b.latency_ms_p50 else 0.0,
        "latency_ms_p95": round(b.latency_ms_p95, 2) if b.latency_ms_p95 else 0.0,
        "throughput_img_per_sec": round(b.throughput_img_per_sec, 2) if b.throughput_img_per_sec else 0.0,
        "notes": b.notes,
        "created_at": b.created_at.isoformat() if b.created_at else "",
    }

@router.get("", response_model=List[BenchmarkRunResponse])
def list_benchmarks(model_id: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(models.Benchmark)
    if model_id:
        query = query.filter(models.Benchmark.model_id == model_id)
    results = query.order_by(models.Benchmark.created_at.desc()).all()
    return [_to_response(b) for b in results]

@router.post("/run", response_model=BenchmarkRunResponse)
def run_benchmark(payload: BenchmarkRunRequest, db: Session = Depends(get_db)):
    # Verify model exists
    model = db.query(models.Model).filter(models.Model.id == payload.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {payload.model_id} not found")
    
    try:
        run_data = run_benchmark_job(
            model_id=payload.model_id,
            dataset_name=payload.dataset_name,
            sample_count=payload.sample_count,
            manifest_path=payload.manifest_path,
        )
        
        db_benchmark = models.Benchmark(
            model_id=run_data["model_id"],
            dataset=run_data["dataset"],
            accuracy=run_data.get("accuracy", 0.0),
            precision_weighted=run_data.get("precision_weighted", 0.0),
            recall_weighted=run_data.get("recall_weighted", 0.0),
            f1_weighted=run_data.get("f1_weighted", 0.0),
            latency_ms_p50=run_data.get("latency_ms_p50", 0.0),
            latency_ms_p95=run_data.get("latency_ms_p95", 0.0),
            throughput_img_per_sec=run_data.get("throughput_img_per_sec", 0.0),
            notes=run_data.get("notes", "")
        )
        db.add(db_benchmark)
        db.commit()
        db.refresh(db_benchmark)
        return _to_response(db_benchmark)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(exc)}")

@router.get("/compare", response_model=List[BenchmarkRunResponse])
def compare_benchmarks(model_ids: str = Query(default=""), db: Session = Depends(get_db)):
    requested_ids = [item.strip() for item in model_ids.split(",") if item.strip()]
    query = db.query(models.Benchmark)
    if requested_ids:
        query = query.filter(models.Benchmark.model_id.in_(requested_ids))
    results = query.all()
    return [_to_response(b) for b in results]
