import pytest
from unittest.mock import patch, MagicMock, ANY
from fastapi.testclient import TestClient
from app.infrastructure.crypt import encrypt_secret, decrypt_secret
from app.db import models
from app.db.models import UserCredential
from app.domains.auth.services import get_current_user

# Helper to override authentication in dependency injection
@pytest.fixture
def auth_user():
    user = models.User(
        id="test_user_123",
        email="test_user@omnivax.com",
        role=models.UserRole.DEVELOPER,
        onboarding_completed=True
    )
    return user

def test_encryption_decryption():
    secret = "hf_my_super_secret_token_12345"
    encrypted = encrypt_secret(secret)
    assert encrypted != secret
    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret

@patch("app.domains.auth.credentials_verification.validate_huggingface_token")
@patch("app.domains.auth.credentials_verification.validate_kaggle_keys")
def test_credentials_api_flow(mock_kaggle, mock_hf, client, db, auth_user):
    # Mock validator responses
    mock_hf.side_effect = lambda t: t == "hf_valid_token_12345"
    mock_kaggle.side_effect = lambda u, k: u == "kaggle_user" and k == "kaggle_valid_key_123"

    # Override get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: auth_user

    try:
        # 1. Post invalid HF token
        response = client.post(
            "/auth/credentials",
            json={"source": "huggingface", "token": "hf_invalid"}
        )
        assert response.status_code == 400
        assert "Invalid Hugging Face token" in response.json()["detail"]

        # 2. Post valid HF token
        response = client.post(
            "/auth/credentials",
            json={"source": "huggingface", "token": "hf_valid_token_12345"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "huggingface"
        assert data["is_valid"] is True
        assert data["token_masked"] == "hf_val...2345"

        # 3. List credentials
        response = client.get("/auth/credentials")
        assert response.status_code == 200
        creds = response.json()
        assert len(creds) == 1
        assert creds[0]["source"] == "huggingface"
        assert creds[0]["token_masked"] == "hf_val...2345"

        # 4. Post valid Kaggle credentials
        response = client.post(
            "/auth/credentials",
            json={"source": "kaggle", "username": "kaggle_user", "key": "kaggle_valid_key_123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "kaggle"
        assert data["username"] == "kaggle_user"
        assert data["token_masked"] == "kagg..._123"

        # 5. List again (should show both)
        response = client.get("/auth/credentials")
        assert response.status_code == 200
        creds = response.json()
        assert len(creds) == 2

        # 6. Delete HF credentials
        response = client.delete("/auth/credentials/huggingface")
        assert response.status_code == 200
        assert "huggingface" in response.json()["message"]

        # 7. List again (should show only Kaggle)
        response = client.get("/auth/credentials")
        assert response.status_code == 200
        creds = response.json()
        assert len(creds) == 1
        assert creds[0]["source"] == "kaggle"

    finally:
        # Clean up dependency overrides
        app.dependency_overrides.pop(get_current_user, None)
        # Clean up database records
        db.query(UserCredential).filter(UserCredential.user_id == auth_user.id).delete()
        db.commit()

@patch("app.domains.models.tasks.hf_hub_download")
@patch("app.domains.models.tasks.validation_service.run_smoke_test")
def test_task_credential_handling(mock_smoke, mock_download, db, auth_user):
    from app.domains.models.tasks import deploy_model_from_hub
    
    # Setup mock validation success
    mock_smoke.return_value = {"is_success": True, "benchmark": {"latency": 10}, "logs": "Smoke test success"}
    mock_download.return_value = "/tmp/mock_model.pth"

    # Setup database user
    db_user = db.query(models.User).filter(models.User.id == auth_user.id).first()
    if not db_user:
        db.add(auth_user)
        db.commit()

    # Add credentials to DB
    encrypted = encrypt_secret("hf_valid_token_12345")
    cred = UserCredential(
        user_id=auth_user.id,
        source="huggingface",
        encrypted_token=encrypted,
        is_valid=True
    )
    db.add(cred)
    db.commit()

    # Pre-register a model record
    model_id = "test_model_task_auth"
    db_model = models.Model(
        id=model_id,
        name="Test Task Auth Model",
        version="v1",
        owner_id=auth_user.id,
        status="downloading",
        artifact_path=""
    )
    db.add(db_model)
    db.commit()

    with patch("app.domains.models.tasks.SessionLocal", return_value=db), \
         patch.object(db, "close", MagicMock()):
        try:
            # Execute the Celery task synchronously
            deploy_model_from_hub(
                model_id=model_id,
                source="huggingface",
                repo_id="test-user/test-model",
                filename="model.pth",
                user_id=auth_user.id
            )

            # Verify token was passed to hf_hub_download
            mock_download.assert_called_with(
                repo_id="test-user/test-model",
                filename="model.pth",
                local_dir=ANY,
                token="hf_valid_token_12345"
            )

            # Check model is activated
            db.refresh(db_model)
            assert db_model.status == "active"
            assert db_model.is_verified is True

        finally:
            # Clean up database
            db.query(UserCredential).filter(UserCredential.user_id == auth_user.id).delete()
            db.query(models.Model).filter(models.Model.id == model_id).delete()
            db.query(models.User).filter(models.User.id == auth_user.id).delete()
            db.commit()

