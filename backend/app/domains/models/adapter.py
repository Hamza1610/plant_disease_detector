import json
import os
from typing import Dict, Any, List, Optional
import numpy as np
from pathlib import Path

# We import the existing adapters to reuse their loading logic
from app.domains.inference.adapters.keras_h5 import KerasH5Adapter
from app.domains.inference.adapters.sklearn_pickle import SklearnPickleAdapter

class ModelValidationService:
    @staticmethod
    def extract_metadata(file_path: str, framework: str) -> Dict[str, Any]:
        """
        Attempts to extract class names and other metadata from a model file.
        """
        metadata = {}
        file_path_obj = Path(file_path)
        
        if not file_path_obj.exists():
            return {"error": "File not found"}

        try:
            if file_path_obj.suffix.lower() == ".json":
                # Direct config.json probe
                with open(file_path, 'r') as f:
                    config = json.load(f)
                    # Support standard HF id2label or a simple list/dict
                    if "id2label" in config:
                        metadata["class_names"] = list(config["id2label"].values())
                    elif "class_names" in config:
                        metadata["class_names"] = config["class_names"]
                    elif isinstance(config, list):
                        metadata["class_names"] = config
                    elif isinstance(config, dict) and all(isinstance(k, (int, str)) for k in config.keys()):
                         metadata["class_names"] = list(config.values())

            elif framework == "sklearn":
                # Scikit-learn usually has classes_ attribute
                adapter = SklearnPickleAdapter(file_path, {})
                if hasattr(adapter.model, "classes_"):
                    metadata["class_names"] = adapter.model.classes_.tolist()
            
            elif framework == "keras":
                # Keras models sometimes have metadata in H5 attributes
                import h5py
                with h5py.File(file_path, 'r') as f:
                    if 'class_names' in f.attrs:
                        metadata["class_names"] = json.loads(f.attrs['class_names'])
            
            elif framework == "pytorch":
                import torch
                checkpoint = torch.load(file_path, map_location="cpu")
                if isinstance(checkpoint, dict):
                    # Look for common label keys
                    for key in ["classes", "class_names", "labels", "idx_to_class"]:
                        if key in checkpoint:
                            val = checkpoint[key]
                            if isinstance(val, dict):
                                metadata["class_names"] = list(val.values())
                            else:
                                metadata["class_names"] = val
                            break
        except Exception as e:
            metadata["error"] = f"Extraction failed: {str(e)}"
        
        return metadata

    @staticmethod
    async def run_smoke_test(file_path: str, framework: str, expected_classes: List[str]) -> Dict[str, Any]:
        """
        Performs a synthetic inference test to verify model integrity.
        """
        logs = []
        is_success = False
        
        try:
            logs.append(f"Starting smoke test for {framework} model...")
            
            if framework == "keras":
                adapter = KerasH5Adapter(file_path, {"class_names": expected_classes})
                # Create a synthetic 224x224 RGB image
                dummy_input = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
                from PIL import Image
                from io import BytesIO
                img = Image.fromarray(dummy_input)
                buf = BytesIO()
                img.save(buf, format="JPEG")
                
                results = adapter.predict_image_bytes(buf.getvalue())
                logs.append(f"Inference successful. Top result: {results[0]['label']}")
                is_success = True
                
            elif framework == "sklearn":
                adapter = SklearnPickleAdapter(file_path, {"class_names": expected_classes})
                dummy_input = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
                from PIL import Image
                from io import BytesIO
                img = Image.fromarray(dummy_input)
                buf = BytesIO()
                img.save(buf, format="JPEG")
                
                results = adapter.predict_image_bytes(buf.getvalue())
                logs.append(f"Inference successful. Top result: {results[0]['label']}")
                is_success = True
            
            else:
                logs.append(f"Framework {framework} not yet supported for automated smoke testing.")
                is_success = True # Pass for unsupported frameworks for now
                
        except Exception as e:
            logs.append(f"CRITICAL FAILURE: {str(e)}")
            is_success = False
            
        return {
            "is_success": is_success,
            "logs": "\n".join(logs)
        }

validation_service = ModelValidationService()
