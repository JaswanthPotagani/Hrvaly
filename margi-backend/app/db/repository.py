from sqlalchemy.orm import Session , joinedload
from app.db import models

def get_user_applications_optimized(db:Session, user_id: str):
    """
    Fetches job applications and their related resumes in one query.
    Prevents the performance hit 
    """
    return db.query(models.JobApplication).options(joinedload(models.JobApplication.resume)).filter(models.JobApplication.userId == user_id).all()

