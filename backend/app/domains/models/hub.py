import os
import shutil
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
import requests
from huggingface_hub import hf_hub_download, snapshot_download, HfApi
import kagglehub

class ModelHubService:
    def __init__(self, cache_dir: str = "static/models/temp"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.hf_api = HfApi()

    async def pull_from_huggingface(self, repo_id: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Pulls a model from Hugging Face Hub.
        If filename is provided, pulls that specific file.
        Otherwise, pulls the entire snapshot or looks for common weights.
        """
        try:
            if filename:
                # Pull specific file (e.g., model.h5 or config.json)
                local_path = hf_hub_download(repo_id=repo_id, filename=filename, local_dir=self.cache_dir / repo_id)
                return {"path": local_path, "repo_id": repo_id, "filename": filename}
            
            # Pull entire snapshot
            local_path = snapshot_download(repo_id=repo_id, local_dir=self.cache_dir / repo_id)
            
            # Try to auto-extract metadata from config.json if it exists
            metadata = self._extract_hf_metadata(repo_id)
            
            return {
                "path": local_path,
                "repo_id": repo_id,
                "metadata": metadata
            }
        except Exception as e:
            raise Exception(f"Hugging Face pull failed: {str(e)}")

    async def pull_from_kaggle(self, model_handle: str) -> Dict[str, Any]:
        """
        Pulls a model from Kaggle Hub.
        """
        try:
            # kagglehub.model_download returns the local path
            local_path = kagglehub.model_download(model_handle)
            return {"path": local_path, "handle": model_handle}
        except Exception as e:
            raise Exception(f"Kaggle pull failed: {str(e)}")

    async def pull_from_url(self, url: str, filename: str) -> Dict[str, Any]:
        """
        Pulls a model from a generic URL.
        """
        try:
            target_path = self.cache_dir / filename
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(target_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return {"path": str(target_path), "url": url}
        except Exception as e:
            raise Exception(f"URL pull failed: {str(e)}")

    def _extract_hf_metadata(self, repo_id: str) -> Dict[str, Any]:
        """
        Attempts to extract id2label mapping from config.json in HF hub.
        """
        try:
            config_path = hf_hub_download(repo_id=repo_id, filename="config.json")
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            id2label = config.get("id2label")
            if id2label:
                # Convert keys to int if they are strings (JSON standard)
                labels = [id2label[str(i)] for i in range(len(id2label))]
                return {"class_names": labels, "framework": config.get("framework", "unknown")}
        except:
            pass
        return {}

hub_service = ModelHubService()
