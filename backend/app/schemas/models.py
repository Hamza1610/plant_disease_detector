from typing import Any

from pydantic import BaseModel, Field


class ModelSummary(BaseModel):
    model_id: str
    name: str
    version: str
    status: str
    description: str
    tags: list[str]
    supported_plants: list[str]
    supported_diseases: list[str]
    pricing_tier: str
    benchmark_summary: dict[str, Any]


class ModelDetail(ModelSummary):
    artifact_path: str
    framework: str
    input_spec: dict[str, Any]
    output_spec: dict[str, Any]
    preprocess: dict[str, Any]
    class_names: list[str]
    class_to_idx: dict[str, int]
    training_notes: str
    limitations: list[str]
    safety_notes: list[str]


class RegisterModelRequest(BaseModel):
    model_id: str
    name: str
    version: str
    status: str = "experimental"
    description: str
    tags: list[str] = Field(default_factory=list)
    supported_plants: list[str] = Field(default_factory=list)
    supported_diseases: list[str] = Field(default_factory=list)
    pricing_tier: str = "free"
    benchmark_summary: dict[str, Any] = Field(default_factory=dict)
    metadata_file: str
