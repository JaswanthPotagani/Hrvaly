from sqlalchemy import Session
from sqlalchemy import func
from app.db import models

def calculate_percentile(db:Session, user_score: float, role_niche: str):
    """
    Calculates where a user stands compared to other in the same niche.
    """
    total_below = db.query(models.User).filter(models.User.industry == role_niche, models.User.learnabilityScore < user_score).count()

    return (user_below/ total_users) * 100

    