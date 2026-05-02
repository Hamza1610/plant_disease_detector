import json
import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel

CONFIG_DIR = Path.home() / ".omnivax"
CONFIG_FILE = CONFIG_DIR / "config.json"

class CliConfig(BaseModel):
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    access_token: Optional[str] = None
    api_url: str = "http://localhost:8000"

def save_config(config: CliConfig):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        f.write(config.model_dump_json(indent=2))
    # Set restricted permissions
    os.chmod(CONFIG_FILE, 0o600)

def load_config() -> CliConfig:
    if not CONFIG_FILE.exists():
        return CliConfig()
    try:
        with open(CONFIG_FILE, "r") as f:
            return CliConfig.model_validate_json(f.read())
    except Exception:
        return CliConfig()

def clear_config():
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
