# 🚀 Redis caching for similarity calculations and expensive operations
try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore
import json
import hashlib
from typing import Any, Optional
import os

class CacheManager:
    def __init__(self):
        # Try to connect to Redis, fallback to in-memory cache if unavailable
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            if redis is None:
                raise RuntimeError("redis library not installed")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()  # Test connection
            self.redis_available = True
            print("✅ Redis connected successfully")
        except Exception as e:
            print(f"⚠️  Redis not available, using in-memory cache: {e}")
            self.redis_client = None
            self.redis_available = False
            self.memory_cache = {}
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate a cache key from data"""
        data_str = json.dumps(data, sort_keys=True) if isinstance(data, dict) else str(data)
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.redis_available:
                value = self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                return self.memory_cache.get(key)
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL (seconds)"""
        try:
            if self.redis_available:
                return self.redis_client.setex(key, ttl, json.dumps(value))
            else:
                self.memory_cache[key] = value
                return True
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self.redis_available:
                return bool(self.redis_client.delete(key))
            else:
                return self.memory_cache.pop(key, None) is not None
        except Exception:
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if self.redis_available:
                keys = self.redis_client.keys(pattern)
                return self.redis_client.delete(*keys) if keys else 0
            else:
                # For memory cache, we'd need to implement pattern matching
                return 0
        except Exception:
            return 0

# Global cache instance
cache = CacheManager()

def cache_similarity_results(query_hash: str, results: list, ttl: int = 1800) -> bool:
    """Cache similarity calculation results"""
    key = f"similarity:{query_hash}"
    return cache.set(key, results, ttl)

def get_cached_similarity_results(query_hash: str) -> Optional[list]:
    """Get cached similarity calculation results"""
    key = f"similarity:{query_hash}"
    return cache.get(key)

def cache_professor_list(department: str, professors: list, ttl: int = 3600) -> bool:
    """Cache professor list by department"""
    key = f"professors:{department or 'all'}"
    return cache.set(key, professors, ttl)

def get_cached_professor_list(department: str) -> Optional[list]:
    """Get cached professor list by department"""
    key = f"professors:{department or 'all'}"
    return cache.get(key)

def clear_professor_cache():
    """Clear all professor-related cache"""
    return cache.clear_pattern("professors:*")

def clear_similarity_cache():
    """Clear all similarity-related cache"""
    return cache.clear_pattern("similarity:*")
