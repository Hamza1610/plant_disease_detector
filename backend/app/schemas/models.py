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
    is_verified: bool = False


class ModelDetail(ModelSummary):
    artifact_path: str
    framework: str
    input_spec: dict[str, Any]
    output_spec: dict[str, Any] = Field(default_factory=dict)
    preprocess: dict[str, Any] = Field(default_factory=dict)
    class_names: list[str] = Field(default_factory=list)
    class_to_idx: dict[str, int] = Field(default_factory=dict)
    training_notes: str = ""
    limitations: list[str] = Field(default_factory=list)
    safety_notes: list[str] = Field(default_factory=list)
    verification_logs: str = ""


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

class PullModelRequest(BaseModel):
    source: str # "huggingface", "kaggle", "url"
    model_id: str
    filename: str | None = None

class ProbeModelRequest(BaseModel):
    file_path: str
    framework: str

class HubDeploymentItem(BaseModel):
    source: str  # "huggingface", "kaggle"
    repo_id: str
    model_id: str
    name: str
    filename: str | None = None
    description: str | None = ""
    class_names: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    framework: str | None = "pytorch"

class BatchHubDeploymentRequest(BaseModel):
    items: list[HubDeploymentItem]

class HubDeploymentResponse(BaseModel):
    model_id: str
    name: str
    status: str
    task_id: str

class BatchHubDeploymentResponse(BaseModel):
    registered_models: list[HubDeploymentResponse]


class ImageParams(BaseModel):
    dimensions: list[int]
    normalization: str = "none" # "imagenet", "rescale_only", "none"

class AudioParams(BaseModel):
    sample_rate: int = 16000
    channels: int = 1
    format: str = "wav"

class TextParams(BaseModel):
    max_length: int = 512

class InputSchemaParams(BaseModel):
    image: ImageParams | None = None
    audio: AudioParams | None = None
    text: TextParams | None = None

class InputSchema(BaseModel):
    modality: str # "image", "audio", "text", "tabular"
    parameters: InputSchemaParams = Field(default_factory=InputSchemaParams)

class ClassificationParams(BaseModel):
    class_names: list[str] = Field(default_factory=list)

class ObjectDetectionParams(BaseModel):
    class_names: list[str] = Field(default_factory=list)
    confidence_threshold: float = 0.5

class OutputSchemaParams(BaseModel):
    classification: ClassificationParams | None = None
    object_detection: ObjectDetectionParams | None = None

class OutputSchema(BaseModel):
    task_type: str # "classification", "regression", "object_detection", "text_generation"
    parameters: OutputSchemaParams = Field(default_factory=OutputSchemaParams)

class ModelSource(BaseModel):
    hub: str # "huggingface", "kaggle"
    repo_id: str
    filename: str | None = None

class ModelConfig(BaseModel):
    model_id: str | None = None
    name: str
    framework: str # "pytorch", "tensorflow", "sklearn", "onnx", "custom"
    model_format: str # "safetensors", "savedmodel", "onnx", "pickle", "keras_h5"
    model_source: ModelSource
    input_schema: InputSchema
    output_schema: OutputSchema
    description: str | None = ""
    tags: list[str] | None = Field(default_factory=list)


