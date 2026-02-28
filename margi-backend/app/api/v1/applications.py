from fastapi import APIRouter, Depends, HTTPException,BackgroundTasks
from app.api.deps import get_current_user
from app.db import models,base
from app.services.letter_service import generate_cover_letter
from sqlalchemy.orm import Session
import uuid

router = APIRouter()

@router.post("/apply")
async def track_application(data:dict, current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):
    application = models.JobApplication(
        id=str(uuid.uuid4()),
        userId = data["jobId"],
        jobId = data["jobId"],
        jobTile = data["jobTitle"],
        employerName = data["employerName"],
        status="applied",
        appliedAt = base.datetime.datetime.utcnow()
    )
    db.add(application)
    db.commit()
    return {"status":"tracked","id":application.id}

@router.post("/generate-letter")
async def create_letter(data:dict, current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):
    resume = db.query(models.Resume).filter(models.Resume.userId == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Please upload a resume first")
    
    content = await generate_cover_letter_ai(resume.content,data["jobTitle"],data["companyName"],data.get("jobDescription"))
    
    new_letter = models.CoverLetter(
        id=str(uuid.uuid4()),
        userId = current_user.id,
        content = content,
        companyName = data["companyName"],
        jobTitle = data["jobTitle"],
        status="generated"
    )
    db.add(new_letter)
    db.commit()
    return {"content":content,"id":new_letter.id}