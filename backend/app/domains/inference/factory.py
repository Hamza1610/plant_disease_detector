from typing import Any, Dict, Type
from app.domains.inference.adapters.base import BaseAdapter
from app.domains.inference.adapters.efficientnet import EfficientNetAdapter
from app.domains.inference.adapters.keras_h5 import KerasH5Adapter
from app.domains.inference.adapters.sklearn_pickle import SklearnPickleAdapter
from app.domains.inference.adapters.declarative import DeclarativeAdapter

class AdapterFactory:
    _registry: Dict[str, Type[BaseAdapter]] = {
        "pytorch": EfficientNetAdapter,
        "efficientnet": EfficientNetAdapter,
        "keras": KerasH5Adapter,
        "h5": KerasH5Adapter,
        "tensorflow": KerasH5Adapter,
        "sklearn": SklearnPickleAdapter,
        "pickle": SklearnPickleAdapter,
    }

    @classmethod
    def create(cls, framework: str, artifact_path: str, model_meta: Dict[str, Any]) -> BaseAdapter:
        # Fallback to DeclarativeAdapter if config schema is declared
        if "input_schema" in model_meta or "output_schema" in model_meta:
            return DeclarativeAdapter(artifact_path, model_meta)
            
        adapter_class = cls._registry.get(framework.lower())
        if not adapter_class:
            raise ValueError(f"Unsupported framework: {framework}. Supported: {list(cls._registry.keys())}")
        
        return adapter_class(artifact_path, model_meta)


    @classmethod
    def register(cls, framework: str, adapter_class: Type[BaseAdapter]):
        cls._registry[framework.lower()] = adapter_class
