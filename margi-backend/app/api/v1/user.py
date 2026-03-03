from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_user
from app.db import models, base
from sqlalchemy.orm import Session
from app.core.redis import is_rate_limited
import datetime

router = APIRouter()

@router.get("/me")
async def read_user_me(current_user: models.User = Depends(get_current_user)):
    if await is_rate_limited(f"user_me:{current_user.id}", limit=100, window=60):
        raise HTTPException(status_code=429, detail="Too many requests")
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "industry" : current_user.industry,
        "plan" : current_user.plan,
        "skills" : current_user.skills,
        "onboarded": bool(current_user.industry and current_user.bio)
    }

@router.post("/update")
async def update_user(
    data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """
    Updates user profile data (Onboarding)
    """
    for key, value in data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)
    
    current_user.updatedAt = datetime.datetime.utcnow()
    db.commit()
    return {"success": True}
