from pydantic import BaseModel


class PredictionItem(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    model_id: str
    top_prediction: PredictionItem
    predictions: list[PredictionItem]
