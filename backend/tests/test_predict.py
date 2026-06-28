from unittest.mock import MagicMock, patch
from pathlib import Path
import io
from app.db import models
from app.domains.auth.services import get_current_user

@patch("app.domains.inference.services.model_storage.get_artifact_path")
@patch("app.domains.inference.services.AdapterFactory.create")
def test_predict_success(mock_create_adapter, mock_get_path, client, db):
    # Mock storage resolution to return a dummy Path object
    mock_get_path.return_value = Path("dummy_path.pth")
    
    # 1. Setup mock adapter
    mock_adapter = MagicMock()
    mock_adapter.predict_image_bytes.return_value = [
        {"label": "Tomato Healthy", "confidence": 0.99},
        {"label": "Tomato Wilt", "confidence": 0.01}
    ]
    mock_create_adapter.return_value = mock_adapter

    # 2. Setup user, model, pricing tier
    user = models.User(id="user_predict", email="predict@example.com")
    db.add(user)
    
    pricing_tier = models.PricingTier(tier="free", daily_quota=200)
    db.add(pricing_tier)

    db_model = models.Model(
        id="efficientnet_b0_v1",
        name="Test Model",
        framework="pytorch",
        pricing_tier="free",
        artifact_path="mock_weights.pth"
    )
    db.add(db_model)
    db.commit()

    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: user

    # 3. Perform prediction request
    image_content = b"fake-image-bytes"
    files = {"image": ("test.jpg", io.BytesIO(image_content), "image/jpeg")}
    data = {"model_id": "efficientnet_b0_v1"}
    
    response = client.post("/predict", files=files, data=data)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["top_prediction"]["label"] == "Tomato Healthy"
    
    # 4. Verify log in database
    log = db.query(models.PredictionLog).filter(models.PredictionLog.user_id == user.id).first()
    assert log is not None
    assert log.predicted_class == "Tomato Healthy"

    app.dependency_overrides.clear()
