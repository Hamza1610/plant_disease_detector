import json
from unittest.mock import MagicMock, patch
from pathlib import Path
import pytest
from app.db import models
from app.domains.auth.services import get_current_user
from app.domains.models.repository import ModelRepository
from app.schemas.models import ModelConfig
from app.domains.inference.adapters.declarative import DeclarativeAdapter

def test_model_id_generation(db):
    repo = ModelRepository(db)
    # Generate unique slug for new name
    slug1 = repo.generate_model_id("Tomato Rust Classifier")
    assert slug1 == "tomato_rust_classifier_v1"
    
    # Pre-register model with that ID
    db_model = models.Model(
        id="tomato_rust_classifier_v1",
        name="Tomato Rust Classifier",
        framework="pytorch",
        pricing_tier="free"
    )
    db.add(db_model)
    db.commit()
    
    # Generate slug again, should conflict and increment version tag
    slug2 = repo.generate_model_id("Tomato Rust Classifier")
    assert slug2 == "tomato_rust_classifier_v2"


def test_schema_validator():
    config_data = {
        "name": "Coffee Leaf Spot CNN",
        "framework": "pytorch",
        "model_format": "safetensors",
        "model_source": {
            "hub": "huggingface",
            "repo_id": "user/coffee-model",
            "filename": "model.safetensors"
        },
        "input_schema": {
            "modality": "image",
            "parameters": {
                "image": {
                    "dimensions": [224, 224, 3],
                    "normalization": "imagenet"
                }
            }
        },
        "output_schema": {
            "task_type": "classification",
            "parameters": {
                "classification": {
                    "class_names": ["healthy", "rust", "miner"]
                }
            }
        },
        "tags": ["coffee", "rust"]
    }
    
    # Validate Pydantic schema parsing
    cfg = ModelConfig(**config_data)
    assert cfg.name == "Coffee Leaf Spot CNN"
    assert cfg.framework == "pytorch"
    assert cfg.input_schema.modality == "image"
    assert cfg.input_schema.parameters.image.dimensions == [224, 224, 3]
    assert cfg.output_schema.parameters.classification.class_names == ["healthy", "rust", "miner"]


@patch("app.domains.inference.adapters.declarative.DeclarativeAdapter._load_model")
def test_declarative_adapter_preprocessing(mock_load):
    mock_load.return_value = MagicMock()
    
    model_meta = {
        "framework": "pytorch",
        "model_format": "safetensors",
        "input_schema": {
            "modality": "image",
            "parameters": {
                "image": {
                    "dimensions": [224, 224, 3],
                    "normalization": "imagenet"
                }
            }
        },
        "output_schema": {
            "task_type": "classification",
            "parameters": {
                "classification": {
                    "class_names": ["healthy", "diseased"]
                }
            }
        }
    }
    
    adapter = DeclarativeAdapter(artifact_path="dummy_path.safetensors", model_meta=model_meta)
    
    # Create fake RGB image bytes
    from PIL import Image
    import io
    import numpy as np
    
    img = Image.fromarray(np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()
    
    # Mock PyTorch output predictions
    adapter.model = MagicMock()
    # Mock inference call
    with patch("torch.from_numpy") as mock_from_numpy:
        mock_output = MagicMock()
        mock_output.cpu.return_value.numpy.return_value = np.array([0.9, 0.1], dtype=np.float32)
        adapter.model.return_value = [mock_output]
        
        preds = adapter.predict_image_bytes(img_bytes, top_k=2)
        assert len(preds) == 2
        assert preds[0]["label"] == "healthy"
        assert preds[0]["confidence"] == 0.9


@patch("app.domains.models.routes.deploy_model_from_hub.delay")
def test_deploy_config_endpoint(mock_delay, client, db):
    # Mock celery delay return task with string id to pass response schema validation
    mock_task = MagicMock()
    mock_task.id = "mock-task-id-12345"
    mock_delay.return_value = mock_task

    # Register mock user
    user = models.User(id="user_deploy_config", email="config_deploy@example.com", role=models.UserRole.DEVELOPER)
    db.add(user)
    db.commit()
    
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: user
    
    config_payload = {
        "name": "Orange Spot ViT",
        "framework": "pytorch",
        "model_format": "safetensors",
        "model_source": {
            "hub": "huggingface",
            "repo_id": "org/orange-model",
            "filename": "model.safetensors"
        },
        "input_schema": {
            "modality": "image",
            "parameters": {
                "image": {
                    "dimensions": [224, 224, 3],
                    "normalization": "imagenet"
                }
            }
        },
        "output_schema": {
            "task_type": "classification",
            "parameters": {
                "classification": {
                    "class_names": ["healthy", "spot"]
                }
            }
        }
    }
    
    response = client.post("/models/deploy-config", json=config_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "downloading"
    assert "orange_spot_vit_v1" in res_data["model_id"]
    
    # Verify task was dispatched to worker
    assert mock_delay.call_count == 1
    
    app.dependency_overrides.clear()
