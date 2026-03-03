from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from app.api.deps import get_current_user
from app.db import models, base
from app.services.voice_service import evaluate_voice_response
from sqlalchemy.orm import Session
import uuid

router = APIRouter()

async def process_voice_result_worker(assessment_id: str, response: list, industry: str,db: Session):

    result = await evaluate_voice_response(response,industry)


    assesment = db.query(models.VoiceAssessment).filter(models.VoiceAssessment.id==assessment_id).first()
    if assesment:
        assesment.quizScore=result["score"]
        assesment.improvementTip =  result["tips"]
        db.commit()

@router.post("/submit")
async def submit_voice_interview(
    data:dict,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db:Session = Depends(base.get_db)
):

    assessment_id = str(uuid.uuid4())
    new_assessment = models.VoiceAssessment(
        id=assessment_id,
        userId = current_user.id,
        quizScore=0.0,
        questions=data["responses"],
        category="Voice"
    )
    db.add(new_assessment)
    db.commit()

    background_tasks.add_task(
        process_voice_result_worker,
        assessment_id,
        data["responses"],
        current_user.industry,
        db
    )

    return {"id": assessment_id,"status":"evaluating"}

    

