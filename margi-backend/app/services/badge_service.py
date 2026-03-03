from sqlalchemy import Session
from sqlalchemy import func
from app.db import models

def calculate_percentile(db:Session, user_score: float, role_niche: str):
    """
    Calculates where a user stands compared to other in the same niche.
    """
    total_below = db.query(models.User).filter(models.User.industry == role_niche, models.User.learnabilityScore < user_score).count()
    total_users = db.query(models.User).filter(models.User.industry == role_niche).count()

    if total_users == 0:
        return 0

    return (total_below / total_users) * 100

    