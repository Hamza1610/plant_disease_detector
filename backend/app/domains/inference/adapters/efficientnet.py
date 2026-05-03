from io import BytesIO
from typing import Any, List, Dict
import torch
from PIL import Image
from torchvision import models, transforms
from app.domains.inference.adapters.base import BaseAdapter

class EfficientNetAdapter(BaseAdapter):
    def __init__(self, artifact_path: str, model_meta: Dict[str, Any]) -> None:
        self.artifact_path = artifact_path
        self.model_meta = model_meta
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.transform = self._build_transform()

    def _load_model(self) -> torch.nn.Module:
        # Note: class_names might be passed as output_classes in the new DB-based metadata
        class_names = self.model_meta.get("class_names") or self.model_meta.get("output_classes", [])
        if isinstance(class_names, str):
            import json
            class_names = json.loads(class_names)
            
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(class_names))
        state_dict = torch.load(self.artifact_path, map_location=self.device)
        model.load_state_dict(state_dict)
        model.to(self.device)
        model.eval()
        return model

    def _build_transform(self) -> transforms.Compose:
        prep = self.model_meta.get("preprocess", {})
        image_size = prep.get("image_size", 224)
        mean = prep.get("mean", [0.485, 0.456, 0.406])
        std = prep.get("std", [0.229, 0.224, 0.225])
        
        return transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ]
        )

    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 3) -> List[Dict[str, Any]]:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(input_tensor)
            probs = torch.softmax(logits, dim=1)[0].cpu()

        class_names = self.model_meta.get("class_names") or self.model_meta.get("output_classes", [])
        if isinstance(class_names, str):
            import json
            class_names = json.loads(class_names)
            
        top_k = min(top_k, len(class_names))
        values, indices = torch.topk(probs, k=top_k)

        predictions = []
        for value, idx in zip(values.tolist(), indices.tolist()):
            predictions.append(
                {
                    "label": class_names[idx],
                    "confidence": round(float(value), 6),
                }
            )
        return predictions

    def cleanup(self):
        if torch.cuda.is_available():
            del self.model
            torch.cuda.empty_cache()
