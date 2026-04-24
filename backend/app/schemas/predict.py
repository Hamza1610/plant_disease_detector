from pydantic import BaseModel


class PredictionItem(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    model_id: str
    top_prediction: PredictionItem
    predictions: list[PredictionItem]

class PredictionHistoryItem(BaseModel):
    id: int
    model_id: str
    image_filename: str | None
    predicted_class: str
    confidence: float
    created_at: str

    class Config:
        from_attributes = True
