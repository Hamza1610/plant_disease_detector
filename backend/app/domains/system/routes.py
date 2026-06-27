from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.settings import settings
from app.infrastructure.database import get_db
from app.domains.auth.services import require_role
from app.db.models import UserRole, AuditLog, User

router = APIRouter(tags=["system"])

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@router.get("/info")
def info() -> dict[str, str]:
    return {"name": settings.app_name, "version": settings.app_version}

@router.get("/audit", response_model=List[Dict[str, Any]])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user = Depends(require_role([UserRole.ENTERPRISE, UserRole.DEVELOPER]))
):
    """Retrieves genuine, real-time security events logged within the ecosystem."""
    logs = db.query(AuditLog)\
        .order_by(AuditLog.created_at.desc())\
        .limit(50).all()
    
    return [
        {
            "event": log.action,
            "user": log.user.email if log.user else "SYSTEM Daemon",
            "ip": log.ip_address or "127.0.0.1",
            "time": log.created_at.isoformat()
        } for log in logs
    ]
