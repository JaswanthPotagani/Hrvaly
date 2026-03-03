from app.core.redis import redis_client
import json
import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db import models, base

router = APIRouter()

async def get_app_count(db, user_id):
    return db.query(models.JobApplication).filter_by(userId = user_id).count()

async def get_latest_assessment(db, user_id):
    return db.query(models.Assessment).filter_by(userId=user_id).order_by(models.Assessment.createdAt.desc()).first()


@router.get("/stats")
async def get_dashboard_stats(current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):

    cache_key =f"dash_stats:{current_user.id}"
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    app_count, latest_eval = await asyncio.gather(get_app_count(db, current_user.id), get_latest_assessment(db, current_user.id))
    
    stats = {"total_applications":app_count, "latest_score": latest_eval.quizScore if latest_eval else 0, "industry": current_user.industry}

    await redis_client.setex(cache_key,300,json.dumps(stats))
    return stats
    