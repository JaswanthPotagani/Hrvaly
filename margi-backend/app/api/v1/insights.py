from fastapi import APIRouter, Depends , BackgroundTasks
from app.api.deps import get_current_user
from app.db import models,base
from app.services.insight_service import generativeai_industry_trends
from app.core.redis import redis_client
from sqlalchemy.orm import Session
import json

router = APIRouter()

@router.get("/{industry}")
async def get_market_pulse(industry:str, location:str,current_user: models.User = Depends(get_current_user), db:Session = Depends(base.get_db)):
    cache_key =f"insight:{industry}:{location}"

    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    insight = db.query(models.IndustryInsight).filter(models.IndustryInsight.industry == industry, models.IndustryInsight.location == location).first()

    if insight:

        data = {c.name: getattr(insight, c.name) for c in insight.__table__.columns}
        await redis_client.setex(cache_key,3600,json.dumps(data, default=str))
        return data

    return {"message" : "Insight generation queued for your industry."}
    