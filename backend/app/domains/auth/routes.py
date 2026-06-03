import secrets
import json
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
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        role=user.role or models.UserRole.STANDARD
    )
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
    
    from app.domains.system.audit import AuditService
    AuditService(db).log("key_created", user_id=current_user.id, resource_id=db_key.id, metadata={"name": name})
    
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
    
    from app.domains.system.audit import AuditService
    AuditService(db).log("key_revoked", user_id=current_user.id, resource_id=key_id, metadata={"name": db_key.name})
    
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
    
    from app.domains.system.audit import AuditService
    AuditService(db).log("key_toggled", user_id=current_user.id, resource_id=key_id, metadata={"active": db_key.is_active})
    
    return {"message": f"Key {'activated' if db_key.is_active else 'deactivated'} successfully", "is_active": db_key.is_active}

@router.post("/onboarding")
def complete_onboarding(
    data: dict, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    current_user.onboarding_completed = True
    current_user.profile_metadata = json.dumps(data)
    db.commit()
    
    from app.domains.system.audit import AuditService
    AuditService(db).log("onboarding_completed", user_id=current_user.id, metadata=data)
    
    return {"status": "success", "message": "Onboarding profile updated"}

@router.post("/sync-role", response_model=dict)
def sync_user_role(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    requested_role = payload.get("role")
    valid_roles = ["standard", "developer", "enterprise"]
    
    if requested_role in valid_roles:
        # Safety: Only allow updates if user is standard (prevent escalation hacks)
        if current_user.role == models.UserRole.STANDARD:
            current_user.role = requested_role
            db.commit()
            
            from app.domains.system.audit import AuditService
            AuditService(db).log("role_synced", user_id=current_user.id, metadata={"role": requested_role})
            
            return {"status": "success", "role": requested_role}
            
    return {"status": "no-op", "role": current_user.role}

@router.delete("/account")
def delete_account(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Log activity before destroying the record context
    from app.domains.system.audit import AuditService
    AuditService(db).log("account_deleted", user_id=current_user.id, resource_id=current_user.id)

    # Manually purge related entities to avoid foreign key constraint violations
    db.query(models.ApiKey).filter(models.ApiKey.user_id == current_user.id).delete()
    db.query(models.PredictionLog).filter(models.PredictionLog.user_id == current_user.id).delete()
    
    # Finally, delete user identity
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account fully deleted"}
