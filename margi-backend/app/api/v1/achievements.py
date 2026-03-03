from fastapi import APIRouter, Depends , HTTPException
from app.api.deps import get_current_user
from app.db import models,base
from app.services.badge_service import calculate_percentile
from sqlalchemy.orm import Session
import uuid

router = APIRouter()

@router.post("/milestones/generate")
async def generate_weekly_milstones(
    current_user:models.User = Depends(get_current_user), db:Session =Depends(base.get_db)):

    new_milestone = models.CareerMilstone(
        id=str(uuid.uuid4()),
        userId =current_user.id,
        week=1,
        title="Master FastAPI Basics",
        content ="Complete the Day 1-8 backend migration tasks.",
        status ="PENDING"
    )
    db.add(new_milestone)
    db.commit()
    return new_milestone

@router.get("/badge/verify/{share_id}")
async def verify_badge(share_id: str, db: Session = Depends(base.get_db)):
    badge =db.query(models.VerificationBadge).filter(models.VerificationBadge.uniqueShareableId == share_id).first()

    if not badge:
        raise HTTPException(status_code =404, detail = "Invalid Badge ID")

    return {
        "user" : badge.user.name,
        "niche" : badge.roleNiche,
        "rank" : badge.percentileRank,
        "issued": badge.createdAt
    }