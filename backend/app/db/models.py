from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.infrastructure.database import Base

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


class Model(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True, index=True)  # e.g., 'efficientnet_b0_v1'
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, index=True) # e.g., 'EfficientNet B0 Plant Disease'
    version = Column(String)
    status = Column(String, default="active") # active, archived, etc
    description = Column(String)
    artifact_path = Column(String)
    framework = Column(String) # pytorch, onnx, etc
    input_spec = Column(String)  # JSON encoded spec
    output_classes = Column(String)  # JSON encoded list of classes
    supported_plants = Column(String) # JSON encoded list
    supported_diseases = Column(String) # JSON encoded list
    tags = Column(String) # JSON encoded list of tags
    pricing_tier = Column(String, default="free")
    benchmark_summary = Column(String) # JSON encoded summary
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(String) # Catch-all for extra data


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


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., 'Production CLI'
    prefix = Column(String, nullable=False) # e.g., 'omni_abc123'
    key_hash = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="api_keys")

class PricingTier(Base):
    __tablename__ = "pricing_tiers"

    tier = Column(String, primary_key=True) # free, pro, enterprise
    daily_quota = Column(Integer, default=200) # -1 for unlimited
    features = Column(String) # JSON encoded list

class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, ForeignKey("models.id"))
    dataset = Column(String)
    accuracy = Column(Float)
    precision_weighted = Column(Float)
    recall_weighted = Column(Float)
    f1_weighted = Column(Float)
    latency_ms_p50 = Column(Float)
    latency_ms_p95 = Column(Float)
    throughput_img_per_sec = Column(Float)
    notes = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
