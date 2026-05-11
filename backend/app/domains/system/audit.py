from sqlalchemy.orm import Session
from app.db import models
import json
from typing import Optional

class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log(self, action: str, user_id: Optional[str] = None, resource_id: Optional[str] = None, metadata: Optional[dict] = None, ip_address: Optional[str] = None):
        log_entry = models.AuditLog(
            user_id=user_id,
            action=action,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata) if metadata else None,
            ip_address=ip_address
        )
        self.db.add(log_entry)
        self.db.commit()
