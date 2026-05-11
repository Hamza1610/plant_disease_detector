from fastapi import Request, HTTPException, Depends
from app.db.models import UserRole
import time
from typing import Dict, Tuple

# Simple in-memory rate limiter for demonstration
# In production, use Redis
class RateLimiter:
    def __init__(self):
        # { (user_id, endpoint): (last_request_time, count) }
        self.requests: Dict[Tuple[str, str], Tuple[float, int]] = {}
        
        self.limits = {
            UserRole.STANDARD: 10,     # 10 requests per minute
            UserRole.DEVELOPER: 100,   # 100 requests per minute
            UserRole.ENTERPRISE: 1000  # 1000 requests per minute
        }

    def is_rate_limited(self, user_id: str, role: str, endpoint: str) -> bool:
        now = time.time()
        key = (user_id, endpoint)
        
        limit = self.limits.get(role, 10)
        
        if key not in self.requests:
            self.requests[key] = (now, 1)
            return False
            
        last_time, count = self.requests[key]
        
        # Reset if more than a minute has passed
        if now - last_time > 60:
            self.requests[key] = (now, 1)
            return False
            
        if count >= limit:
            return True
            
        self.requests[key] = (last_time, count + 1)
        return False

limiter = RateLimiter()

async def rate_limit(request: Request, current_user = Depends(lambda: None)): # Dependency injection will handle actual user
    # We need the user from auth, but avoid circular imports
    # This is a placeholder for where the middleware/dependency would sit
    pass
