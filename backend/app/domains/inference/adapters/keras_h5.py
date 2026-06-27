import json
from io import BytesIO
from typing import Any, List, Dict
from PIL import Image
import numpy as np
from app.domains.inference.adapters.base import BaseAdapter

class KerasH5Adapter(BaseAdapter):
    def __init__(self, artifact_path: str, model_meta: Dict[str, Any]) -> None:
        self.artifact_path = artifact_path
        self.model_meta = model_meta
        self.model = self._load_model()

    def _load_model(self):
        # Use tf_keras (Legacy Keras 2) for .h5 files if available, 
        # as it provides the best compatibility for older artifacts.
        try:
            try:
                import tf_keras as keras
            except ImportError:
                import tensorflow.keras as keras
            
            model = keras.models.load_model(self.artifact_path, compile=False)
            return model
        except Exception as e:
            raise Exception(f"Keras Load Failure: {str(e)}")

    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 3) -> List[Dict[str, Any]]:
        # 1. PREPROCESS STAGE
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        prep = self.model_meta.get("preprocess") or {}
        image_size = prep.get("image_size")
        
        # Fallback: Try to auto-detect from model input shape
        if not image_size:
            try:
                # Keras models usually have (None, H, W, C)
                shape = self.model.input_shape
                if isinstance(shape, list): shape = shape[0]
                if shape and len(shape) >= 3:
                    # Check if height == width, or just take the first dimension
                    image_size = shape[1] 
            except:
                image_size = 224 # Final fallback
        
        # Channels-last resizing: shape [H, W, C]
        img_resized = image.resize((image_size, image_size))
        img_array = np.array(img_resized).astype(np.float32)
        
        # [0, 1] Normalized rescaling
        img_array = img_array / 255.0
        
        # Add batch dimension to yield shape [1, H, W, 3]
        input_tensor = np.expand_dims(img_array, axis=0)

        # 2. INFERENCE STAGE
        predictions = self.model.predict(input_tensor, verbose=0)[0]

        # 3. POSTPROCESS STAGE
        class_names = self.model_meta.get("class_names") or self.model_meta.get("output_classes", [])
        if isinstance(class_names, str):
            class_names = json.loads(class_names)

        top_indices = np.argsort(predictions)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                "label": class_names[int(idx)] if int(idx) < len(class_names) else f"class_{idx}",
                "confidence": round(float(predictions[idx]), 6)
            })
        return results

    def cleanup(self):
        # Explicit graph clearing if supported
        import gc
        del self.model
        gc.collect()
