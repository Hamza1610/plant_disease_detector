from typing import Any, Dict, Optional
import time
from datetime import datetime, timedelta

class AdapterCache:
    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        
        item = self._cache[key]
        if time.time() > item["expiry"]:
            self.remove(key)
            return None
            
        # Update expiry on access (optional, but good for keeping active models)
        item["expiry"] = time.time() + self.ttl_seconds
        return item["adapter"]

    def set(self, key: str, adapter: Any):
        self._cache[key] = {
            "adapter": adapter,
            "expiry": time.time() + self.ttl_seconds,
            "created_at": datetime.now()
        }

    def remove(self, key: str):
        if key in self._cache:
            # If the adapter has a cleanup method, call it (e.g., clearing GPU memory)
            adapter = self._cache[key]["adapter"]
            if hasattr(adapter, "cleanup"):
                try:
                    adapter.cleanup()
                except Exception:
                    pass
            del self._cache[key]

    def clear(self):
        keys = list(self._cache.keys())
        for k in keys:
            self.remove(k)

# Global instance
adapter_cache = AdapterCache(ttl_seconds=3600) # 1 hour default
