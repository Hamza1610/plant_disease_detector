import json
from sqlalchemy.orm import Session
from app.db import models
from app.infrastructure.database import engine, SessionLocal, Base
from app.core.settings import settings
from app.domains.models.repository import ModelRepository

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    try:
        # 1. Seed Pricing Tiers
        if not db.query(models.PricingTier).first():
            pricing_file = settings.models_metadata_dir / "pricing_tiers.json"
            if pricing_file.exists():
                tiers = json.loads(pricing_file.read_text())
                for t in tiers:
                    db_tier = models.PricingTier(
                        tier=t["tier"],
                        daily_quota=int(t["daily_quota"]),
                        features=json.dumps(t.get("features", []))
                    )
                    db.add(db_tier)
                db.commit()

        # 2. Seed Models
        if not db.query(models.Model).first():
            models_index_file = settings.models_metadata_dir / "models.json"
            if models_index_file.exists():
                index = json.loads(models_index_file.read_text())
                repo = ModelRepository(db)
                for item in index:
                    # Get detailed metadata
                    detail_file = settings.models_metadata_dir / item["metadata_file"]
                    if detail_file.exists():
                        detail = json.loads(detail_file.read_text())
                        repo.create({
                            "id": detail["model_id"],
                            "name": detail["name"],
                            "version": detail["version"],
                            "status": detail["status"],
                            "description": detail["description"],
                            "artifact_path": detail["artifact_path"],
                            "framework": detail.get("framework", "pytorch"),
                            "input_spec": detail.get("input_spec", {}),
                            "output_classes": detail.get("class_names", []),
                            "supported_plants": detail.get("supported_plants", []),
                            "supported_diseases": detail.get("supported_diseases", []),
                            "tags": detail.get("tags", []),
                            "pricing_tier": detail.get("pricing_tier", "free"),
                            "benchmark_summary": detail.get("benchmark_summary", {}),
                            "metadata_json": json.dumps(detail) # Save everything else
                        })
                db.commit()

        # 3. Seed Benchmarks
        if not db.query(models.Benchmark).first():
            benchmarks_file = settings.models_metadata_dir / "benchmarks.json"
            if benchmarks_file.exists():
                benchmarks = json.loads(benchmarks_file.read_text())
                for b in benchmarks:
                    db_benchmark = models.Benchmark(
                        model_id=b["model_id"],
                        dataset=b.get("dataset", "seed_dataset"),
                        accuracy=b.get("accuracy", b.get("validation_accuracy", 0.0)),
                        precision_weighted=b.get("precision_weighted", 0.0),
                        recall_weighted=b.get("recall_weighted", 0.0),
                        f1_weighted=b.get("f1_weighted", b.get("weighted_f1", 0.0)),
                        latency_ms_p50=b.get("latency_ms_p50", 0.0),
                        latency_ms_p95=b.get("latency_ms_p95", 0.0),
                        throughput_img_per_sec=b.get("throughput_img_per_sec", 0.0),
                        notes=b.get("notes", "Seeded from legacy JSON")
                    )
                    db.add(db_benchmark)
                db.commit()
    finally:
        db.close()
