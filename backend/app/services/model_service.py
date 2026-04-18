from app.core.settings import settings
from app.registry.model_registry import ModelRegistry

registry = ModelRegistry(settings.models_metadata_dir)
registry.load()
