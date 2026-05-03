from pathlib import Path
from typing import Optional
from app.core.settings import settings

class ModelStorage:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    def get_artifact_path(self, relative_path: str) -> Path:
        """
        Resolves a relative path to an absolute path in the artifact directory.
        """
        # Ensure we only get the filename if it's a full path in metadata
        artifact_name = Path(relative_path).name
        full_path = self.base_dir / artifact_name
        
        if not full_path.exists():
            raise FileNotFoundError(f"Model artifact not found at: {full_path}")
            
        return full_path

    def list_artifacts(self) -> list[Path]:
        return list(self.base_dir.glob("*.pth"))

# Global instance
model_storage = ModelStorage(settings.models_artifacts_dir)
