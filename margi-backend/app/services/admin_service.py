from sqlalchemy.orm import Session
from app.db import models
import datetime

def check_user_access(user: models.User):
    """
    Verifies if a user is banned or temporarily locked.
    """

    if user.bannedAt:
        return False, "Your account has been suspended."

    if user.failedLoginAttempts >= 5:
        return False, "Too mainy failed attempts. Please reset your password."

    return True, None

def log_webhook(db: Session, webhook_id: str):
    """
    Prevents duplicate processing of webhooks (Idempotency).
    """

    exists = db.query(models.ProcessedWbhook).filter_by(id=webhook_id).first()
    if exists:
        return False

    new_log = models.ProcessedWbhook(id=webhook_id)
    db.add(new_log)
    db.commit()
    return True
    