import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from supabase import create_client, Client

from app.core.settings import settings
from app.infrastructure.database import get_db
from app.db import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize Supabase client
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_JWT_SECRET)

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def _safe_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    return password.encode('utf-8')[:71].decode('utf-8', 'ignore')

def verify_password(plain_password: str, hashed_password: str):
    if not hashed_password:
        return False
    safe_pw = _safe_password(plain_password).encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(safe_pw, hash_bytes)

def get_password_hash(password: str):
    safe_pw = _safe_password(password).encode('utf-8')
    return bcrypt.hashpw(safe_pw, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str | None = Depends(oauth2_scheme), 
    x_api_key: str | None = Header(None),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id = None
    email = None

    # 1. Try API Key Auth
    if x_api_key:
        hashed_key = hash_api_key(x_api_key)
        db_key = db.query(models.ApiKey).filter(models.ApiKey.key_hash == hashed_key).first()
        if db_key:
            if not db_key.is_active:
                raise HTTPException(status_code=401, detail="API Key is deactivated")
            db_key.last_used_at = datetime.now(timezone.utc)
            db.commit()
            return db_key.user

    # 2. Try Supabase Auth
    if token:
        try:
            auth_response = supabase_client.auth.get_user(token)
            sb_user = auth_response.user
            if sb_user:
                user_id = sb_user.id
                email = sb_user.email
        except Exception as e:
            # Removed legacy JWT fallback as per refactor plan
            print(f"Supabase Auth Verification Failed: {e}")
            raise credentials_exception

    if not user_id:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
    
    # Auto-provisioning
    if user is None:
        user = models.User(id=user_id, email=email, role=models.UserRole.STANDARD)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

def require_role(roles: List[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted to roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker
