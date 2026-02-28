from sqlalchemy.orm import Session
from app.db import models
from app.services.ai_services import analyse_resume_with_ai
from app.core.redis import redis_client

async def process_resume_background(resume_id: str, content:str, industry:str, db:Session):
    """
    Threaded worker to process AI analysis without making the user wait.
    """
    
    analysis = await analyse_resume_with_ai(content, industry)

    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if resume:
        resume.ats_score = analysis["ats_score"]
        resume.feedback = analysis["feedback"]
        db.commit()

    await redis_client.setex(f"resume_score:{resume_id}",86400,str(analysis["ats_score"])) 
    
