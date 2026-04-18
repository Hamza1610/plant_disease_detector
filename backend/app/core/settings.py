from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Omniverse API"
    app_version: str = "0.1.0"
    debug: bool = True
    default_model_id: str = "efficientnet_b0_v1"

    # Environment overrides
    SECRET_KEY: str
    DATABASE_URL: str
    GEMINI_API_KEY: str

    workspace_root: Path = Path(__file__).resolve().parents[3]
    models_metadata_dir: Path = workspace_root / "models" / "metadata"
    models_artifacts_dir: Path = workspace_root / "models" / "artifacts"
    benchmark_runs_dir: Path = workspace_root / "benchmarks" / "runs"

    model_config = SettingsConfigDict(env_file=str(Path(__file__).resolve().parents[3] / ".env"), env_file_encoding="utf-8")


settings = Settings()
