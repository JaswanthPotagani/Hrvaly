from fastapi import BackgroundTasks

def update_user_activity(db: Session, user_id:  str):
    user = db.query(models.User).filter_by(id=user_id).first()

    if user: 
        user.actionCount += 1
        user.lastLogin = datetime.datetime.utcnow()
        db.commit()