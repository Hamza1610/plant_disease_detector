from unittest.mock import MagicMock, patch
import io
from app.db import models
from app.api.auth import get_current_user

@patch("app.api.predict._get_adapter")
def test_predict_success(mock_get_adapter, client, db):
    # 1. Setup mock adapter
    mock_adapter = MagicMock()
    mock_adapter.predict_image_bytes.return_value = [
        {"label": "Tomato Healthy", "confidence": 0.99},
        {"label": "Tomato Wilt", "confidence": 0.01}
    ]
    mock_get_adapter.return_value = mock_adapter

    # 2. Setup user and mock auth
    user = models.User(id="user_predict", email="predict@example.com")
    db.add(user)
    # Ensure a model exists in the catalog to satisfy foreign key constraints if they existed
    # (SQLite doesn't always enforce them by default unless PRAGMA is set)
    db_model = models.ModelCatalog(id="efficientnet_b0_v1", title="Test Model")
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
