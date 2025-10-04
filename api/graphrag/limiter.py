from fastapi import Request
from slowapi import Limiter
from .settings import settings

def _rate_key(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else request.client.host

def _conditional_limit(limit_str: str): # If limits disabled, does nothing
    return limiter.limit(limit_str) if settings.rate_limits_enabled else lambda func: func


limiter = Limiter(key_func=_rate_key, storage_uri="memory://")

rate_limit_test = _conditional_limit("3/minute")
rate_limit_create_chat = _conditional_limit(settings.rate_create_chat)
rate_limit_send_message = _conditional_limit(settings.rate_send_message)
