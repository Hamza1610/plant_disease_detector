from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import JWTError, jwt
from app.db.database import get_db
from app.db import models
from app.schemas import user as user_schema
from app.core.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def _safe_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    # Strictly truncates the password to maximum 71 bytes to adhere to bcrypt limits,
    # ignoring utf-8 decode errors in case of splitting a multi-byte char.
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

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Use the official Supabase client to verify the token and get user data
        # This handles HS256, ES256, and other algorithms automatically
        auth_response = supabase_client.auth.get_user(token)
        sb_user = auth_response.user
        
        if not sb_user:
            raise credentials_exception
            
        user_id = sb_user.id
        email = sb_user.email
        
    except Exception as e:
        print(f"Supabase Auth Verification Failed: {e}")
        # Fallback to legacy verification (only if it's not a Supabase token)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            email = payload.get("email") or payload.get("sub")
        except JWTError as e_legacy:
            print(f"Legacy Auth Verification Failed: {e_legacy}")
            raise credentials_exception

    if not user_id:
        raise credentials_exception
        
    # Try finding by ID first
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    # Fallback to finding by email
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
    
    # Auto-provision user if they authenticated but aren't in our local DB yet
    if user is None:
        user = models.User(id=user_id, email=email, role=models.UserRole.STANDARD)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.id != user_id and email == user.email:
        # Update legacy user ID to match Supabase UUID
        user.id = user_id
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
