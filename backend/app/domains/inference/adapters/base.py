from abc import ABC, abstractmethod
from typing import Any, List, Dict

class BaseAdapter(ABC):
    @abstractmethod
    def __init__(self, artifact_path: str, model_meta: Dict[str, Any]):
        pass

    @abstractmethod
    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Run inference on raw image bytes.
        Returns a list of predictions: [{"label": str, "confidence": float}, ...]
        """
        pass

    def cleanup(self):
        """
        Optional cleanup logic (e.g., clearing GPU memory).
        """
        pass
