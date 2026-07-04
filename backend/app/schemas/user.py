from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "standard"

class UserResponse(UserBase):
    id: str
    is_active: Optional[bool] = True
    is_premium: Optional[bool] = False
    role: Optional[str] = "standard"
    onboarding_completed: Optional[bool] = False
    profile_metadata: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CredentialSetRequest(BaseModel):
    source: str # 'huggingface' or 'kaggle'
    token: Optional[str] = None
    username: Optional[str] = None
    key: Optional[str] = None

class CredentialResponse(BaseModel):
    source: str
    is_valid: bool
    token_masked: str
    username: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

