import os
import json
import logging
import asyncio
from pathlib import Path
from typing import List, Optional
from app.core.celery_app import celery_app
from app.core.settings import settings
from app.infrastructure.database import SessionLocal
from app.domains.models.repository import ModelRepository
from app.domains.models.adapter import validation_service
from huggingface_hub import hf_hub_download, snapshot_download
from huggingface_hub.errors import HfHubHTTPError
import kagglehub
from kagglehub.exceptions import UnauthenticatedError

logger = logging.getLogger("celery.tasks")

@celery_app.task(name="tasks.deploy_model_from_hub")
def deploy_model_from_hub(
    model_id: str,
    source: str,
    repo_id: str,
    filename: Optional[str] = None,
    framework: str = "pytorch",
    class_names_json: str = "[]",
    tags_json: str = "[]",
    user_id: Optional[str] = None
):
    """
    Background worker task to download model from Hugging Face or Kaggle,
    probe its metadata/config, run smoke tests, and activate the model.
    """
    logger.info(f"Starting Celery background deployment for model: {model_id} from {source} ({repo_id})")
    
    # 1. Instantiate dedicated DB session
    db = SessionLocal()
    repo = ModelRepository(db)
    
    try:
        # Load input options
        try:
            class_names = json.loads(class_names_json)
        except Exception:
            class_names = []
            
        try:
            tags = json.loads(tags_json)
        except Exception:
            tags = []

        # 2. Update status to downloading
        repo.update(model_id, {
            "status": "downloading",
            "verification_logs": "Background deployment started. Initializing download from Model Hub..."
        })
        
        local_dir = settings.models_artifacts_dir / repo_id.replace("/", "_")
        local_dir.mkdir(parents=True, exist_ok=True)
        
        # 3. Pull weights
        from app.db.models import UserCredential
        from app.infrastructure.crypt import decrypt_secret

        hf_token = None
        kaggle_username = None
        kaggle_key = None

        if user_id:
            cred = db.query(UserCredential).filter(
                UserCredential.user_id == user_id,
                UserCredential.source == source,
                UserCredential.is_valid == True
            ).first()
            if cred:
                try:
                    decrypted = decrypt_secret(cred.encrypted_token)
                    if source == "huggingface":
                        hf_token = decrypted
                    elif source == "kaggle":
                        kaggle_key = decrypted
                        if cred.metadata_json:
                            meta = json.loads(cred.metadata_json)
                            kaggle_username = meta.get("username")
                except Exception as ce:
                    logger.error(f"Failed to decrypt credentials for user {user_id}: {ce}")

        main_file_path = None
        if repo_id.startswith("mock/"):
            logger.info(f"Using mock repository handler for: {repo_id}")
            mock_filename = filename or "model.pth"
            mock_file = local_dir / mock_filename
            with open(mock_file, "wb") as f:
                f.write(b"MOCK_WEIGHTS_CONTENT")
            # Write config.json
            config_json_path = local_dir / "config.json"
            with open(config_json_path, "w") as f:
                json.dump({
                    "model_id": model_id,
                    "name": model_id,
                    "class_names": class_names or ["mock_healthy", "mock_diseased"],
                    "framework": framework
                }, f)
            main_file_path = mock_file if filename else local_dir
        elif source == "huggingface":
            if filename:
                logger.info(f"Downloading file '{filename}' from HF repo: {repo_id}")
                local_file = hf_hub_download(repo_id=repo_id, filename=filename, local_dir=local_dir, token=hf_token)
                main_file_path = Path(local_file)
            else:
                logger.info(f"Downloading complete snapshot from HF repo: {repo_id}")
                snapshot_dir = snapshot_download(
                    repo_id=repo_id,
                    local_dir=local_dir,
                    allow_patterns=["*.pth", "*.pt", "*.h5", "*.pkl", "config.json"],
                    token=hf_token
                )
                main_file_path = Path(snapshot_dir)
        elif source == "kaggle":
            logger.info(f"Downloading model from Kaggle: {repo_id}")
            old_user = os.environ.get("KAGGLE_USERNAME")
            old_key = os.environ.get("KAGGLE_KEY")
            old_token = os.environ.get("KAGGLE_API_TOKEN")
            try:
                if kaggle_username and kaggle_key:
                    os.environ["KAGGLE_USERNAME"] = kaggle_username
                    os.environ["KAGGLE_KEY"] = kaggle_key
                    os.environ["KAGGLE_API_TOKEN"] = kaggle_key
                
                # Reload kagglehub to pick up task-level credentials
                import importlib
                import kagglehub
                importlib.reload(kagglehub)

                if filename:
                    local_file = kagglehub.model_download(repo_id, path=filename)
                    main_file_path = Path(local_file)
                else:
                    download_dir = kagglehub.model_download(repo_id)
                    main_file_path = Path(download_dir)
            finally:
                if kaggle_username and kaggle_key:
                    if old_user is not None:
                        os.environ["KAGGLE_USERNAME"] = old_user
                    else:
                        os.environ.pop("KAGGLE_USERNAME", None)
                    if old_key is not None:
                        os.environ["KAGGLE_KEY"] = old_key
                    else:
                        os.environ.pop("KAGGLE_KEY", None)
                    if old_token is not None:
                        os.environ["KAGGLE_API_TOKEN"] = old_token
                    else:
                        os.environ.pop("KAGGLE_API_TOKEN", None)
        else:
            raise ValueError(f"Unsupported model hub source: {source}")


        # If downloaded path is a directory, resolve the main weights file
        if main_file_path.is_dir():
            weights_extensions = [".pth", ".pt", ".h5", ".pkl", ".joblib"]
            found_weights = []
            for ext in weights_extensions:
                found_weights.extend(main_file_path.glob(f"**/*{ext}"))
            
            # Look for config.json to auto-extract classes
            config_json_path = main_file_path / "config.json"
            if config_json_path.exists():
                try:
                    with open(config_json_path, "r", encoding="utf-8") as f:
                        config_data = json.load(f)
                    
                    extracted_classes = []
                    if "class_names" in config_data:
                        extracted_classes = config_data["class_names"]
                    elif "output_classes" in config_data:
                        extracted_classes = config_data["output_classes"]
                    elif "id2label" in config_data:
                        id2label = config_data["id2label"]
                        if isinstance(id2label, dict):
                            extracted_classes = [id2label[str(i)] for i in range(len(id2label)) if str(i) in id2label]
                        elif isinstance(id2label, list):
                            extracted_classes = id2label
                    
                    if extracted_classes and not class_names:
                        class_names = extracted_classes
                except Exception as ex:
                    logger.warning(f"Failed to parse downloaded config.json: {ex}")

            if found_weights:
                main_file_path = found_weights[0]
            else:
                # If no weights match, check if there is config.json but no model file
                raise FileNotFoundError(f"No weights file (.pth, .pt, .h5, .pkl, .joblib) found in directory '{main_file_path}'")

        logger.info(f"Model file resolved to: {main_file_path}")
        
        # 4. Update status to verifying
        repo.update(model_id, {
            "status": "verifying",
            "artifact_path": str(main_file_path),
            "output_classes": class_names,
            "verification_logs": "Artifact successfully pulled. Initiating automated smoke tests and profiling..."
        })
        
        # 5. Run smoke test and benchmarking using asyncio runner
        logger.info(f"Running automated smoke test for {model_id}...")
        test_results = asyncio.run(
            validation_service.run_smoke_test(str(main_file_path), framework, class_names)
        )
        
        # 6. Update database record with final evaluation status
        if test_results.get("is_success"):
            logger.info(f"Smoke test succeeded for model {model_id}.")
            repo.update(model_id, {
                "status": "active",
                "is_verified": True,
                "benchmark_summary": test_results.get("benchmark", {}),
                "verification_logs": test_results.get("logs", ""),
                "metadata_json": {
                    "model_id": model_id,
                    "name": repo.get_by_id(model_id).name,
                    "class_names": class_names,
                    "tags": tags,
                    "framework": framework
                }
            })
        else:
            logger.error(f"Smoke test failed for model {model_id}.")
            repo.update(model_id, {
                "status": "failed",
                "is_verified": False,
                "verification_logs": test_results.get("logs", "Validation check failed.")
            })
            
    except (HfHubHTTPError, UnauthenticatedError) as auth_err:
        logger.warning(f"Authentication exception during hub download: {auth_err}")
        if user_id:
            try:
                from app.db.models import UserCredential
                cred_to_disable = db.query(UserCredential).filter(
                    UserCredential.user_id == user_id,
                    UserCredential.source == source
                ).first()
                if cred_to_disable:
                    cred_to_disable.is_valid = False
                    db.commit()
                    logger.info(f"Flagged invalid credentials in DB for user {user_id}, source {source}")
            except Exception as db_ex:
                logger.error(f"Failed to invalidate credentials in DB: {db_ex}")
        
        try:
            repo.update(model_id, {
                "status": "failed",
                "is_verified": False,
                "verification_logs": f"AUTHENTICATION FAILURE: The provided {source} token or credentials are invalid or have expired."
            })
        except Exception as db_ex:
            logger.error(f"Failed to write auth failure logs to database: {db_ex}")
            
    except Exception as e:
        logger.exception(f"Exception raised during background model deployment: {e}")
        try:
            repo.update(model_id, {
                "status": "failed",
                "is_verified": False,
                "verification_logs": f"CRITICAL FAILURE: {str(e)}"
            })
        except Exception as db_ex:
            logger.error(f"Failed to write failure logs to database: {db_ex}")
            
    finally:
        db.close()
        logger.info(f"Finished background deployment task for: {model_id}")
