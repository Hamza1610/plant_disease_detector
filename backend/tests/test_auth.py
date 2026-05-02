import pytest
from app.db import models
from app.api.auth import get_current_user

def test_api_key_generation(client, db):
    # 1. Create a dummy user
    user = models.User(id="test_user", email="test@example.com", role=models.UserRole.DEVELOPER)
    db.add(user)
    db.commit()

    # 2. Mock authentication to bypass Supabase for this test
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: user

    # 3. Request a new API key
    response = client.post("/auth/api-keys?name=TestKey")
    assert response.status_code == 200
    data = response.json()
    assert "api_key" in data
    assert data["name"] == "TestKey"
    
    # 4. Verify it's in the DB
    assert db.query(models.ApiKey).count() == 1
    
    app.dependency_overrides.clear()

def test_api_key_authentication(client, db):
    # 1. Create a user and a key
    user = models.User(id="test_user_2", email="test2@example.com", role=models.UserRole.STANDARD)
    db.add(user)
    db.commit()
    
    from app.api.auth import hash_api_key
    raw_key = "omni_test123"
    db_key = models.ApiKey(
        user_id=user.id,
        name="Key 1",
        prefix="omni_test",
        key_hash=hash_api_key(raw_key)
    )
    db.add(db_key)
    db.commit()

    # 2. Try to access /auth/me with the API key in headers
    response = client.get("/auth/me", headers={"X-API-Key": raw_key})
    assert response.status_code == 200
    assert response.json()["email"] == "test2@example.com"
