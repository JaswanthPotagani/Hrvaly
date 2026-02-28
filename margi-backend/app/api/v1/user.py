from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.db import models
from app.core.redis import is_rate_limited

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
        "skills" : current_user.skills
    }
