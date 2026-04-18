from io import BytesIO
from typing import Any

import torch
from PIL import Image
from torchvision import models, transforms


class EfficientNetB0Adapter:
    def __init__(self, artifact_path: str, model_meta: dict[str, Any]) -> None:
        self.artifact_path = artifact_path
        self.model_meta = model_meta
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.transform = self._build_transform()

    def _load_model(self) -> torch.nn.Module:
        class_names = self.model_meta["class_names"]
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(class_names))
        state_dict = torch.load(self.artifact_path, map_location=self.device)
        model.load_state_dict(state_dict)
        model.to(self.device)
        model.eval()
        return model

    def _build_transform(self) -> transforms.Compose:
        prep = self.model_meta["preprocess"]
        return transforms.Compose(
            [
                transforms.Resize((prep["image_size"], prep["image_size"])),
                transforms.ToTensor(),
                transforms.Normalize(mean=prep["mean"], std=prep["std"]),
            ]
        )

    def predict_image_bytes(self, image_bytes: bytes, top_k: int = 3) -> list[dict[str, float | str]]:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(input_tensor)
            probs = torch.softmax(logits, dim=1)[0].cpu()

        class_names: list[str] = self.model_meta["class_names"]
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
