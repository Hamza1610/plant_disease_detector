import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from typer.testing import CliRunner
from omnivax.models import app

runner = CliRunner()

def test_cli_register_success(tmp_path):
    # Create valid config file
    config_file = tmp_path / "valid_config.json"
    config_data = {
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
    config_file.write_text(json.dumps(config_data))

    # Mock CLI config, auth headers, and backend HTTP call
    with patch("omnivax.models.load_config") as mock_load_config, \
         patch("omnivax.models.get_auth_headers") as mock_auth_headers, \
         patch("httpx.post") as mock_post:
        
        mock_load_config.return_value = MagicMock(api_url="http://localhost:8000")
        mock_auth_headers.return_value = {"Authorization": "Bearer test"}
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "model_id": "orange_spot_vit_v1",
            "status": "downloading",
            "task_id": "mock-task-123"
        }
        mock_post.return_value = mock_response

        # Execute Typer CLI command: register --config <path>
        result = runner.invoke(app, ["register", "--config", str(config_file)])
        
        assert result.exit_code == 0
        assert "Success!" in result.output
        assert "orange_spot_vit_v1" in result.output
        assert "downloading" in result.output

def test_cli_register_invalid_config(tmp_path):
    config_file = tmp_path / "invalid_config.json"
    # Missing required 'name' field
    config_data = {
        "framework": "pytorch"
    }
    config_file.write_text(json.dumps(config_data))

    with patch("omnivax.models.load_config") as mock_load_config, \
         patch("omnivax.models.get_auth_headers") as mock_auth_headers:
        
        mock_load_config.return_value = MagicMock(api_url="http://localhost:8000")
        mock_auth_headers.return_value = {"Authorization": "Bearer test"}

        result = runner.invoke(app, ["register", "--config", str(config_file)])
        
        assert result.exit_code == 0
        assert "Client-side Validation Failed" in result.output
