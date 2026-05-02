from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import bcrypt
import hashlib
import secrets
from jose import JWTError, jwt
from app.db.database import get_db
from app.db import models
from app.schemas import user as user_schema
from app.core.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def _safe_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    return password.encode('utf-8')[:71].decode('utf-8', 'ignore')

def verify_password(plain_password: str, hashed_password: str):
    safe_pw = _safe_password(plain_password).encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(safe_pw, hash_bytes)

def get_password_hash(password: str):
    safe_pw = _safe_password(password).encode('utf-8')
    return bcrypt.hashpw(safe_pw, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from supabase import create_client, Client

# Initialize Supabase client for auth verification
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_JWT_SECRET)

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

    # Try API Key Auth First
    if x_api_key:
        hashed_key = hash_api_key(x_api_key)
        db_key = db.query(models.ApiKey).filter(models.ApiKey.key_hash == hashed_key).first()
        if db_key and db_key.is_active:
            # Update last used
            db_key.last_used_at = datetime.now(timezone.utc)
            db.commit()
            return db_key.user
        elif db_key and not db_key.is_active:
            raise HTTPException(status_code=401, detail="API Key is deactivated")

    # Fallback to Token Auth
    if token:
        try:
            auth_response = supabase_client.auth.get_user(token)
            sb_user = auth_response.user
            if sb_user:
                user_id = sb_user.id
                email = sb_user.email
        except Exception as e:
            print(f"Supabase Auth Verification Failed: {e}")
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("sub")
                email = payload.get("email") or payload.get("sub")
            except JWTError:
                raise credentials_exception

    if not user_id:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
    
    if user is None:
        user = models.User(id=user_id, email=email, role=models.UserRole.STANDARD)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

def require_role(roles: list[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted to roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker

@router.post("/api-keys", response_model=dict)
def create_api_key(name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Generate a secure random key
    plain_key = f"omni_{secrets.token_urlsafe(32)}"
    hashed_key = hash_api_key(plain_key)
    
    db_key = models.ApiKey(
        user_id=current_user.id,
        name=name,
        prefix=plain_key[:12], # Store prefix for visibility in UI
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
