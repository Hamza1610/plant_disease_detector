from pydantic import BaseModel, Field


class UsageCheckRequest(BaseModel):
    model_id: str
    user_id: str = Field(default="anonymous")


class UsageRecordRequest(BaseModel):
    model_id: str
    user_id: str = Field(default="anonymous")
    count: int = Field(default=1, ge=1, le=10000)


class UsageAccessResponse(BaseModel):
    model_id: str
    user_id: str
    pricing_tier: str
    daily_quota: int
    used_today: int
    allowed: bool
    remaining: int
