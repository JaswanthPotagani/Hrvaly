from fastapi import Depends, HTTPException, Header
from app.core.security import verify_token
from app.db.base import get_db
from app.db import models
from sqlalchemy.orm import Session

async def get_current_user(authorization: str = Header(None),db:Session = Depends(get_db)):
    print(f"[AUTH] Header: {authorization[:20] if authorization else 'None'}")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        if not payload:
            print("[AUTH] verify_token failed")
            raise HTTPException(status_code=401, detail="Invalid token")
            
        print(f"[AUTH] Payload email: {payload.get('email')}")
        user = db.query(models.User).filter(models.User.email == payload["email"]).first()
        if not user:
            print(f"[AUTH] User not found for email: {payload['email']}")
            raise HTTPException(status_code=401, detail="Invalid user")
        
        print(f"[AUTH] Success for: {user.email}")
        return user
    except Exception as e:
        print(f"[AUTH] CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e