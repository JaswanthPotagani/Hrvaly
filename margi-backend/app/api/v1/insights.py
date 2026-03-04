from fastapi import APIRouter, Depends , BackgroundTasks, HTTPException
from app.api.deps import get_current_user
from app.db import models,base
from app.services.insight_service import generativeai_industry_trends
from app.core.redis import redis_client
from sqlalchemy.orm import Session
import json
import datetime
import uuid

router = APIRouter()

@router.get("/trends")
async def get_industry_trends(current_user: models.User = Depends(get_current_user), db:Session = Depends(base.get_db)):
    # Pass specialization to get_market_pulse
    data = await get_market_pulse(
        industry=current_user.industry, 
        location="Global", 
        specialization=current_user.specialization,
        current_user=current_user, 
        db=db
    )
    if "message" in data: return data
    
    # Fix the mapping: Trending Roles should be the names of the roles from salaryRanges
    salary_ranges = data.get("salaryRanges", [])
    trending_roles = [r.get("role") for r in salary_ranges if r.get("role")]
    
    # Fallback if no roles found (shouldn't happen with updated prompt)
    if not trending_roles:
        trending_roles = data.get("keyTrends", [])

    print(f"[DEBUG] Trending Roles for {current_user.industry}: {trending_roles}")
    return {
        "trendingRoles": trending_roles,
        "salaryData": salary_ranges[0] if salary_ranges else None
    }

@router.get("/skills")
async def get_industry_skills(current_user: models.User = Depends(get_current_user), db:Session = Depends(base.get_db)):
    # Trigger generation with specialization
    data = await get_market_pulse(
        industry=current_user.industry, 
        location="Global", 
        specialization=current_user.specialization,
        current_user=current_user, 
        db=db
    )
    if "message" in data: return data

    print(f"[DEBUG] Skills Data for {current_user.industry}: {data.get('recommendedSkills')}")
    return {
        "currentStatus": {
            "industry": current_user.industry,
            "role": current_user.specialization or current_user.industry or "Professional",
            "experience": current_user.experience if current_user.experience is not None else 0,
            "primarySkill": current_user.skills[0] if current_user.skills and len(current_user.skills) > 0 else "N/A"
        },
        "upgradeSkills": data.get("recommendedSkills", []) or data.get("topSkills", [])
    }

@router.get("/{industry}")
async def get_market_pulse(industry:str, location:str = "Global", specialization: str = None, current_user: models.User = Depends(get_current_user), db:Session = Depends(base.get_db)):
    # Unique cache key per industry + specialization
    cache_key = f"insight:{industry}:{specialization or 'general'}:{location}"

    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    insight = db.query(models.IndustryInsight).filter(models.IndustryInsight.industry == industry, models.IndustryInsight.location == location).first()
    print(f"[DEBUG] get_market_pulse: industry={industry}, existing={bool(insight)}")

    if not insight:
        # Trigger AI generation on the fly
        print(f"[DEBUG] insight missing, triggering AI for {industry}")
        try:
            ai_data = await generativeai_industry_trends(industry, location, specialization)
            print(f"[DEBUG] AI data received: {ai_data.keys()}")
            
            # Save to DB
            new_insight = models.IndustryInsight(
                id=str(uuid.uuid4()),
                industry=industry,
                location=location,
                salaryRanges=ai_data.get("salaryRanges", []),
                growthRate=ai_data.get("growthRate", 0.0),
                demandLevel=ai_data.get("demandLevel", "MEDIUM"),
                topSkills=ai_data.get("topSkills", []),
                marketOutlook=ai_data.get("marketOutlook", "NEUTRAL"),
                keyTrends=ai_data.get("keyTrends", []),
                recommendedSkills=ai_data.get("recommendedSkills", []),
                nextUpdate=datetime.datetime.utcnow() + datetime.timedelta(days=30),
                salaryCurrency=ai_data.get("salaryCurrency", "INR"),
                salaryFrequency=ai_data.get("salaryFrequency", "Lakhs")
            )
            db.add(new_insight)
            db.commit()
            db.refresh(new_insight)
            insight = new_insight
        except Exception as e:
            print(f"Error generating insight: {e}")
            raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(e)}")

    data = {c.name: getattr(insight, c.name) for c in insight.__table__.columns}
    await redis_client.setex(cache_key, 3600, json.dumps(data, default=str))
    return data
    