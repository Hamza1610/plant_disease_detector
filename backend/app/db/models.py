from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base

import enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    STANDARD = "standard"
    DEVELOPER = "developer"
    ENTERPRISE = "enterprise"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth users
    role = Column(String, default=UserRole.STANDARD)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    predictions = relationship("PredictionLog", back_populates="user")


class ModelCatalog(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True, index=True)  # e.g., 'omni-leaf-blight'
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, index=True) # e.g., 'Omni Leaf Blight Spotter v1'
    description = Column(String)
    artifact_path = Column(String)
    input_spec = Column(String)  # image/jpeg etc
    output_classes = Column(String)  # JSON encoded list of classes
    is_active = Column(Boolean, default=True)
    tags = Column(String) # JSON encoded list of tags
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PredictionLog(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    model_id = Column(String, ForeignKey("models.id"))
    image_filename = Column(String)
    predicted_class = Column(String)
    confidence = Column(Float)
    full_result_json = Column(String)  # Full top-k json
    is_live_video = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="predictions")
