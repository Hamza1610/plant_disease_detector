import json
import pickle
from io import BytesIO
from typing import Any, List, Dict
from PIL import Image
import numpy as np
from app.domains.inference.adapters.base import BaseAdapter

class SklearnPickleAdapter(BaseAdapter):
    def __init__(self, artifact_path: str, model_meta: Dict[str, Any]) -> None:
        self.artifact_path = artifact_path
        self.model_meta = model_meta
        self.model = self._load_model()

    def _load_model(self):
        # Fallback lazy loading system for joblib vs pickle serialization
        try:
            import joblib
            try:
                model = joblib.load(self.artifact_path)
                return model
            except Exception:
                with open(self.artifact_path, 'rb') as f:
                    return pickle.load(f)
        except ImportError:
            # Standard fallbacks
            with open(self.artifact_path, 'rb') as f:
                return pickle.load(f)

    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 3) -> List[Dict[str, Any]]:
        # 1. PREPROCESS STAGE
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        prep = self.model_meta.get("preprocess") or {}
        image_size = prep.get("image_size", 64) # Default flat shape bound
        
        img_resized = image.resize((image_size, image_size))
        img_array = np.array(img_resized).astype(np.float32) / 255.0
        
        # Yield flattened format: (1, H * W * C)
        flat_array = img_array.flatten().reshape(1, -1)

        # 2. INFERENCE STAGE
        if hasattr(self.model, "predict_proba"):
            predictions = self.model.predict_proba(flat_array)[0]
        else:
            # Hard prediction fallback
            pred_class = self.model.predict(flat_array)[0]
            return [{"label": str(pred_class), "confidence": 1.0}]

        # 3. POSTPROCESS STAGE
        class_names = self.model_meta.get("class_names") or self.model_meta.get("output_classes", [])
        if isinstance(class_names, str):
            class_names = json.loads(class_names)

        # Use model-intrinsic classes if available, otherwise fallback to explicit meta
        if hasattr(self.model, "classes_"):
            actual_classes = self.model.classes_.tolist()
        else:
            actual_classes = class_names

        top_indices = np.argsort(predictions)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            lbl = actual_classes[int(idx)] if int(idx) < len(actual_classes) else class_names[int(idx)] if int(idx) < len(class_names) else f"class_{idx}"
            results.append({
                "label": str(lbl),
                "confidence": round(float(predictions[idx]), 6)
            })
        return results
