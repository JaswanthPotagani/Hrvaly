from datetime import datetime,timedelta
from typing import Optional
from jose import jwt
import os

ALGORITHM = "HS256"

def verify_token(token: str)-> Optional[dict]:
    try:
        secret = os.getenv("NEXTAUTH_SECRET")
        if not secret:
            print("[AUTH-DEBUG] NEXTAUTH_SECRET is empty or None")
            return None
            
        print(f"[AUTH-DEBUG] Secret length: {len(secret)}, First 3: {secret[:3]}")
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        return payload if payload.get("email") else None
    except Exception as e:
        print(f"[AUTH-DEBUG] jwt.decode failed: {str(e)}")
        return None