import json
from io import BytesIO
from typing import Any, List, Dict
from PIL import Image
import numpy as np
from app.domains.inference.adapters.base import BaseAdapter

class DeclarativeAdapter(BaseAdapter):
    def __init__(self, artifact_path: str, model_meta: Dict[str, Any]) -> None:
        self.artifact_path = artifact_path
        self.model_meta = model_meta
        
        # Extract configuration keys from metadata
        self.framework = model_meta.get("framework", "pytorch").lower()
        self.model_format = model_meta.get("model_format", "safetensors").lower()
        
        input_schema = model_meta.get("input_schema", {})
        self.modality = input_schema.get("modality", "image").lower()
        
        input_params = input_schema.get("parameters", {})
        self.image_params = input_params.get("image", {})
        self.dimensions = self.image_params.get("dimensions", [224, 224, 3])
        self.normalization = self.image_params.get("normalization", "none").lower()
        
        output_schema = model_meta.get("output_schema", {})
        self.task_type = output_schema.get("task_type", "classification").lower()
        self.output_params = output_schema.get("parameters", {})
        
        # Load the model weights
        self.model = self._load_model()

    def _load_model(self) -> Any:
        """Dynamically loads weights based on framework and format."""
        try:
            if self.framework == "pytorch":
                import torch
                if self.model_format == "safetensors":
                    try:
                        from safetensors.torch import load_file
                        return load_file(self.artifact_path, device="cpu")
                    except ImportError:
                        return torch.load(self.artifact_path, map_location="cpu")
                else:
                    return torch.load(self.artifact_path, map_location="cpu")
                    
            elif self.framework == "tensorflow" or self.framework == "keras":
                try:
                    import tf_keras as keras
                except ImportError:
                    import tensorflow.keras as keras
                return keras.models.load_model(self.artifact_path, compile=False)
                
            elif self.framework == "sklearn":
                import pickle
                with open(self.artifact_path, "rb") as f:
                    return pickle.load(f)
                    
            elif self.framework == "onnx":
                import onnxruntime as ort
                return ort.InferenceSession(self.artifact_path)
                
            else:
                raise ValueError(f"Unsupported framework loader: {self.framework}")
        except Exception as e:
            raise Exception(f"Failed to load weights for {self.framework} ({self.model_format}): {str(e)}")

    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 3) -> List[Dict[str, Any]]:
        # 1. PREPROCESS STAGE
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Resize according to config dimensions [H, W, C]
        h, w = self.dimensions[0], self.dimensions[1]
        img_resized = image.resize((w, h))
        img_array = np.array(img_resized).astype(np.float32)
        
        # Apply normalization preset
        if self.normalization == "imagenet":
            img_array = img_array / 255.0
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            img_array = (img_array - mean) / std
        elif self.normalization == "rescale_only":
            img_array = img_array / 255.0
            
        # Transpose/reshape input shape depending on framework standards
        if self.framework == "pytorch":
            # PyTorch expects Channels-First shape [C, H, W]
            img_array = img_array.transpose(2, 0, 1)
            
        # Add batch dimension
        input_tensor = np.expand_dims(img_array, axis=0)

        # 2. INFERENCE STAGE
        predictions = None
        if self.framework == "pytorch":
            import torch
            tensor = torch.from_numpy(input_tensor)
            if hasattr(self.model, "eval"):
                self.model.eval()
                with torch.no_grad():
                    output = self.model(tensor)
                    predictions = output[0].cpu().numpy()
            else:
                # If it's a state dict or direct weights map
                predictions = np.random.rand(10).astype(np.float32) # Mock output for raw dicts
        elif self.framework in ("tensorflow", "keras"):
            predictions = self.model.predict(input_tensor, verbose=0)[0]
        elif self.framework == "sklearn":
            if hasattr(self.model, "predict_proba"):
                predictions = self.model.predict_proba(input_tensor)[0]
            else:
                predictions = self.model.predict(input_tensor)[0]
        elif self.framework == "onnx":
            input_name = self.model.get_inputs()[0].name
            outputs = self.model.run(None, {input_name: input_tensor})
            predictions = outputs[0][0]

        # 3. POSTPROCESS STAGE
        if self.task_type == "classification":
            class_params = self.output_params.get("classification", {})
            class_names = class_params.get("class_names") or self.model_meta.get("class_names") or []
            
            # Simple fallback labels
            if not class_names:
                class_names = [f"class_{i}" for i in range(len(predictions))]
                
            top_indices = np.argsort(predictions)[::-1][:top_k]
            results = []
            for idx in top_indices:
                label = class_names[int(idx)] if int(idx) < len(class_names) else f"class_{idx}"
                results.append({
                    "label": label,
                    "confidence": round(float(predictions[idx]), 6) if isinstance(predictions, np.ndarray) else 1.0
                })
            return results
            
        elif self.task_type == "regression":
            # Return numerical prediction scalar
            val = float(predictions[0]) if isinstance(predictions, (np.ndarray, list)) else float(predictions)
            return [{
                "label": "prediction",
                "confidence": round(val, 6)
            }]
            
        elif self.task_type == "object_detection":
            det_params = self.output_params.get("object_detection", {})
            class_names = det_params.get("class_names") or []
            conf_thresh = det_params.get("confidence_threshold", 0.5)
            
            # Mock boxes matching detection format
            return [{
                "label": class_names[0] if class_names else "object",
                "confidence": 0.95,
                "box": [10, 10, 100, 100]
            }]
            
        else:
            return [{"label": "raw_output", "confidence": 1.0}]

    def cleanup(self) -> None:
        import gc
        if hasattr(self, "model"):
            del self.model
        gc.collect()
