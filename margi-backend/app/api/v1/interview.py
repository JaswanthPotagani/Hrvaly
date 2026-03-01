from fastapi import APIRouter, Depends, BackgroundTasks
from app.api.deps import get_current_user 
from app.db import models,base
from app.services.interview_service import generate_quiz_pool_ai
from sqlalchemy.orm import Session
import uuid

router = APIRouter()

async def init_quiz_pool_worker(user_id: str,industry:str,skills:list,db:Session ):
    questions = await generate_quiz_pool_ai(industry,skills)

    pool = db.query(models.QuizPool).filter(models.QuizPool.userId).first()
    if pool:
        pool.questions = questions
    else:
        pool = models.QuizPool(id=str(uuid.uuid4()), userId= user_id, questions=questions,InterviewType ="Technical")
        db.add(pool)
    db.commit()

@router.post("/start")
async def start_interview(background_tasks:BackgroundTasks,current_user: models.User =Depends(get_current_user),db: Session = Depends(base.get_db)):
    background_tasks.add_tasks(
        init_quiz_pool_worker,
        current_user.id,
        current_user.industry,
        current_user.skills,
        db
    )
    return {"status" : "Generating your custom interview..." , "type": "Technical"}