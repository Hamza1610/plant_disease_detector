import json
import time
import uuid
from pathlib import Path

from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from app.core.settings import settings
from app.inference.efficientnet_adapter import EfficientNetB0Adapter
from app.services.model_service import registry


def _load_adapter(model_id: str) -> tuple[EfficientNetB0Adapter, dict]:
    model_meta = registry.get_model_detail(model_id)
    artifact_name = Path(model_meta["artifact_path"]).name
    artifact_path = settings.models_artifacts_dir / artifact_name
    if not artifact_path.exists():
        raise FileNotFoundError(f"Artifact not found: {artifact_path}")
    return EfficientNetB0Adapter(str(artifact_path), model_meta), model_meta


def _run_manifest_benchmark(model_id: str, manifest_path: str, sample_count: int) -> dict:
    adapter, model_meta = _load_adapter(model_id)
    manifest_file = settings.workspace_root / manifest_path
    if not manifest_file.exists():
        raise FileNotFoundError(f"Manifest file not found: {manifest_file}")

    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    entries = manifest.get("entries", [])[:sample_count]
    if not entries:
        raise ValueError("Manifest has no entries to evaluate.")

    class_to_idx = model_meta["class_to_idx"]
    y_true: list[int] = []
    y_pred: list[int] = []
    latencies_ms: list[float] = []

    for entry in entries:
        image_path = settings.workspace_root / entry["image_path"]
        label_name = entry["label"]
        if not image_path.exists() or label_name not in class_to_idx:
            continue

        image_bytes = image_path.read_bytes()
        t0 = time.perf_counter()
        pred = adapter.predict_image_bytes(image_bytes, top_k=1)[0]["label"]
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)

        y_true.append(class_to_idx[label_name])
        y_pred.append(class_to_idx[pred])

    if not y_true:
        raise ValueError("No valid benchmark entries were evaluated.")

    accuracy = float(accuracy_score(y_true, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true,
        y_pred,
        average="weighted",
        zero_division=0,
    )
    total_time_s = max(sum(latencies_ms) / 1000.0, 1e-9)

    lat_sorted = sorted(latencies_ms)
    p50_idx = int(0.50 * (len(lat_sorted) - 1))
    p95_idx = int(0.95 * (len(lat_sorted) - 1))

    return {
        "run_id": f"run_{uuid.uuid4().hex[:12]}",
        "model_id": model_id,
        "dataset": manifest.get("dataset_name", manifest_path),
        "accuracy": round(accuracy, 4),
        "precision_weighted": round(float(precision), 4),
        "recall_weighted": round(float(recall), 4),
        "f1_weighted": round(float(f1), 4),
        "latency_ms_p50": round(float(lat_sorted[p50_idx]), 2),
        "latency_ms_p95": round(float(lat_sorted[p95_idx]), 2),
        "throughput_img_per_sec": round(float(len(y_true) / total_time_s), 2),
        "notes": f"Manifest benchmark on {len(y_true)} samples.",
    }


def run_benchmark(
    model_id: str,
    dataset_name: str,
    sample_count: int,
    manifest_path: str | None = None,
) -> dict:
    if manifest_path:
        return _run_manifest_benchmark(model_id, manifest_path, sample_count)

    model = registry.get_model_summary(model_id)
    baseline_acc = model.get("benchmark_summary", {}).get("validation_accuracy", 0.85)
    baseline_f1 = model.get("benchmark_summary", {}).get("weighted_f1", baseline_acc)

    # Deterministic synthetic baseline for demo mode.
    return {
        "run_id": f"run_{uuid.uuid4().hex[:12]}",
        "model_id": model_id,
        "dataset": dataset_name,
        "accuracy": round(float(baseline_acc), 4),
        "precision_weighted": round(float(max(0.0, baseline_acc - 0.003)), 4),
        "recall_weighted": round(float(max(0.0, baseline_acc - 0.002)), 4),
        "f1_weighted": round(float(baseline_f1), 4),
        "latency_ms_p50": 52.0,
        "latency_ms_p95": 110.0,
        "throughput_img_per_sec": 18.0,
        "notes": "Synthetic benchmark baseline. Provide manifest_path for real evaluation.",
    }
