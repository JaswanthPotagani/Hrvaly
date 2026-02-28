from datetime import datetime,timedelta
from typing import Optional
from jose import jwt
import os

SECRET_KEY = OS.getenv("NEXTAUTH_SECRET")
ALGORITHM = "HS256"

def verify_token(token: str)-> Optional[dict]:
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        return payload if payload.get("email") else None
    except Exception:
        return None