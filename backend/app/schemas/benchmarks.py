from pydantic import BaseModel, Field


class BenchmarkRunRequest(BaseModel):
    model_id: str
    dataset_name: str = Field(default="quick_sanity")
    sample_count: int = Field(default=32, ge=1, le=10000)
    manifest_path: str | None = None


class BenchmarkRunResponse(BaseModel):
    run_id: str
    model_id: str
    dataset: str
    accuracy: float
    precision_weighted: float
    recall_weighted: float
    f1_weighted: float
    latency_ms_p50: float
    latency_ms_p95: float
    throughput_img_per_sec: float
    notes: str
    created_at: str
