from fastapi import APIRouter, Depends, HTTPException , BackgroundTasks
from app.api.deps import get_current_user
from app.db import models, base
from app.core.worker import process_resume_background
from sqlalchemy.orm import Session
import uuid
import datetime

router = APIRouter()

@router.post("/")
async def create_resume(data: dict,background_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):
    new_resume = models.Resume(
        id=str(uuid.uuid4()),
        userId=current_user.id,
        content=data["content"],
        title=data.get("title", "My Resume"),
        createdAt=datetime.datetime.utcnow(),
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    background_tasks.add_task(process_resume_background, new_resume.id, data["content"], current_user.industry, db)

    return {"id": new_resume.id,"status":"processing"}


@router.get("/{resume_id}")
async def get_resume(resume_id: str, current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id,models.Resume.userId == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume    