import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.db import models
from app.schemas import user as user_schema
from app.domains.auth.services import (
    get_current_user,
    get_password_hash,
    verify_password,
    create_access_token,
    hash_api_key,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=user_schema.UserResponse)
def register(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=user_schema.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=user_schema.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# API Key Management
@router.post("/api-keys", response_model=dict)
def create_api_key(name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    plain_key = f"omni_{secrets.token_urlsafe(32)}"
    hashed_key = hash_api_key(plain_key)
    
    db_key = models.ApiKey(
        user_id=current_user.id,
        name=name,
        prefix=plain_key[:12],
        key_hash=hashed_key
    )
    db.add(db_key)
    db.commit()
    
    return {"name": name, "api_key": plain_key, "message": "Save this key! You will not be able to see it again."}

@router.get("/api-keys", response_model=list[dict])
def list_api_keys(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    keys = db.query(models.ApiKey).filter(models.ApiKey.user_id == current_user.id).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "prefix": k.prefix,
            "is_active": k.is_active,
            "created_at": k.created_at.isoformat(),
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None
        } for k in keys
    ]

@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_key = db.query(models.ApiKey).filter(models.ApiKey.id == key_id, models.ApiKey.user_id == current_user.id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    db.delete(db_key)
    db.commit()
    return {"message": "Key revoked successfully"}

@router.patch("/api-keys/{key_id}/toggle")
def toggle_api_key(key_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_key = db.query(models.ApiKey).filter(models.ApiKey.id == key_id, models.ApiKey.user_id == current_user.id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="Key not found")
    db_key.is_active = not db_key.is_active
    db.commit()
    return {"message": f"Key {'activated' if db_key.is_active else 'deactivated'} successfully", "is_active": db_key.is_active}
