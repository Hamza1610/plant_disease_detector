import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.gaoisxnposygconudgun:WJcGwr8OwAc6XCKb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

print("--- Cleaning Up Model Records in Supabase Database ---")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Deleting specific test models and benchmarks...")
        model_ids = (
            "hf_agri_resnet", "hf_mobilenet_v2", "hf_inception_resnet", 
            "hf_harimitra_tf", "hf_crop_vit", "kaggle_plant_disease", 
            "kaggle_efficientnet_b0", "kaggle_mobilenet_v2", "kaggle_yolov8", 
            "kaggle_vit_fusion"
        )
        conn.execute(
            text("DELETE FROM benchmarks WHERE model_id IN :ids"),
            {"ids": model_ids}
        )
        result = conn.execute(
            text("DELETE FROM models WHERE id IN :ids"),
            {"ids": model_ids}
        )
        conn.commit()
        print(f"✅ Success! Deleted {result.rowcount} test models from registry.")
except Exception as e:
    print(f"❌ Failed to cleanup database: {e}")
