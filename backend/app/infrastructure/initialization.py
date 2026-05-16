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

                db.commit()

        # 4. Seed Prediction Logs (Heatmap Data)
        if not db.query(models.PredictionLog).first():
            # Create a realistic set of surveillance logs
            log_entries = [
                {"country": "Nigeria", "region": "Lagos", "class": "Tomato Leaf Miner", "conf": 0.94, "lat": 6.52, "lng": 3.37},
                {"country": "Nigeria", "region": "Kano", "class": "Cassava Brown Streak", "conf": 0.88, "lat": 12.00, "lng": 8.59},
                {"country": "Kenya", "region": "Nairobi", "class": "Maize Lethal Necrosis", "conf": 0.91, "lat": -1.29, "lng": 36.82},
                {"country": "Ghana", "region": "Accra", "class": "Cocoa Swollen Shoot", "conf": 0.96, "lat": 5.60, "lng": -0.18},
                {"country": "South Africa", "region": "Cape Town", "class": "Grapevine Leafroll", "conf": 0.82, "lat": -33.92, "lng": 18.42},
                {"country": "Ethiopia", "region": "Addis Ababa", "class": "Wheat Rust", "conf": 0.89, "lat": 9.03, "lng": 38.74},
                {"country": "Tanzania", "region": "Dar es Salaam", "class": "Banana Xanthomonas Wilt", "conf": 0.93, "lat": -6.79, "lng": 39.20},
            ]
            
            # Create a bunch of duplicates to simulate density
            import random
            for entry in log_entries:
                for _ in range(random.randint(5, 120)):
                    log = models.PredictionLog(
                        model_id="omnivax-v1",
                        user_id="seed_user",
                        image_path="static/uploads/seed.jpg",
                        predicted_class=entry["class"],
                        confidence=entry["conf"] + random.uniform(-0.1, 0.05),
                        region=entry["region"],
                        country=entry["country"],
                        client_ip=f"192.168.1.{random.randint(1,255)}"
                    )
                    db.add(log)
            db.commit()
    finally:
        db.close()
