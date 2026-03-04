from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.db import base, models
from app.api.deps import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/test-db")
async def test_db(db: Session = Depends(base.get_db)):
    try:
        count = db.query(models.User).count()
        return {"status": "ok", "user_count": count}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/debug-user")
async def debug_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "industry": current_user.industry,
        "onboarded": getattr(current_user, "onboarded", False),
        "raw_attributes": {c.name: getattr(current_user, c.name, "MISSING") for c in current_user.__table__.columns}
    }

async def get_app_count(db, user_id):
    try:
        return db.query(models.JobApplication).filter_by(userId=user_id).count()
    except Exception as e:
        logger.error(f"get_app_count failed for {user_id}: {e}")
        return 0

async def get_user_data_full(db, user):
    try:
        data = {
            "id": user.id,
            "email": user.email,
            "name": getattr(user, "name", "User"),
            "industry": getattr(user, "industry", "None"),
            "specialization": getattr(user, "specialization", None),
            "plan": getattr(user, "plan", "FREE"),
            "experience": getattr(user, "experience", 0),
            "skills": getattr(user, "skills", []) or [],
            "bio": getattr(user, "bio", ""),
            "learnabilityScore": getattr(user, "learnabilityScore", 0.0),
            "decisionQuality": getattr(user, "decisionQuality", {}) or {},
            "secretInsight": getattr(user, "secretInsight", None),
            "assessment": [],
            "milestones": [],
            "badges": [],
            "resume": {"atsScore": 0}
        }
        
        if hasattr(user, "assessments") and user.assessments:
            data["assessment"] = [
                {
                    "id": a.id,
                    "quizScore": getattr(a, "quizScore", 0),
                    "createdAt": a.createdAt.isoformat() if hasattr(a, "createdAt") and a.createdAt else None,
                    "category": getattr(a, "category", "General")
                } for a in user.assessments
            ]

        if hasattr(user, "milestones") and user.milestones:
            data["milestones"] = [
                {
                    "id": m.id,
                    "week": getattr(m, "week", 0),
                    "title": getattr(m, "title", ""),
                    "content": getattr(m, "content", ""),
                    "status": getattr(m, "status", "PENDING"),
                    "createdAt": m.createdAt.isoformat() if hasattr(m, "createdAt") and m.createdAt else None
                } for m in user.milestones
            ]

        if hasattr(user, "badges") and user.badges:
            data["badges"] = [
                {
                    "id": b.id,
                    "roleNiche": getattr(b, "roleNiche", ""),
                    "percentileRank": getattr(b, "percentileRank", 0)
                } for b in user.badges
            ]

        if hasattr(user, "resumes") and user.resumes:
            data["resume"]["atsScore"] = user.resumes[0].atsScore if hasattr(user.resumes[0], "atsScore") else 0
            
        return data
    except Exception as e:
        logger.error(f"get_user_data_full failed: {str(e)}")
        raise e

@router.get("/stats")
async def get_dashboard_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(base.get_db)):
    try:
        user = db.query(models.User).options(
            selectinload(models.User.assessments),
            selectinload(models.User.milestones),
            selectinload(models.User.badges),
            selectinload(models.User.resumes)
        ).filter(models.User.id == current_user.id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        app_count = await get_app_count(db, user.id)
        full_data = await get_user_data_full(db, user)
        full_data["total_applications"] = app_count
        
        return full_data
    except Exception as e:
        logger.error(f"get_dashboard_stats failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Dashboard stats error: {str(e)}")