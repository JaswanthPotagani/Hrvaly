from fastapi import Depends, HTTPException, Header
from app.core.security import verify_token
from app.db.base import get_db
from app.db import models
from sqlalchemy.orm import Session

async def get_current_user(authorization: str = Header(None),db:Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == payload["email"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user