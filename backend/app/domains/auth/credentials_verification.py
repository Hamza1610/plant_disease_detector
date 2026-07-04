import os
import logging
from huggingface_hub import HfApi
from huggingface_hub.errors import HfHubHTTPError
import kagglehub
from kagglehub.exceptions import UnauthenticatedError

logger = logging.getLogger("app.auth.credentials")

def validate_huggingface_token(token: str) -> bool:
    """Validate a Hugging Face user token."""
    if not token:
        return False
    try:
        api = HfApi(token=token)
        api.whoami()
        return True
    except HfHubHTTPError as e:
        logger.warning(f"Hugging Face token validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error validating Hugging Face token: {e}")
        return False

def validate_kaggle_keys(username: str, key: str) -> bool:
    """Validate Kaggle API keys by overriding environment variables temporarily."""
    if not username or not key:
        return False
    
    old_user = os.environ.get("KAGGLE_USERNAME")
    old_key = os.environ.get("KAGGLE_KEY")
    
    try:
        os.environ["KAGGLE_USERNAME"] = username
        os.environ["KAGGLE_KEY"] = key
        # Call whoami to verify credentials
        kagglehub.whoami()
        return True
    except UnauthenticatedError as e:
        logger.warning(f"Kaggle credentials validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error validating Kaggle credentials: {e}")
        return False
    finally:
        # Restore environment variables
        if old_user is not None:
            os.environ["KAGGLE_USERNAME"] = old_user
        else:
            os.environ.pop("KAGGLE_USERNAME", None)
            
        if old_key is not None:
            os.environ["KAGGLE_KEY"] = old_key
        else:
            os.environ.pop("KAGGLE_KEY", None)
