from fastapi import APIRouter, Depends, BackgroundTasks, Body, HTTPException
from app.api.deps import get_current_user 
from app.db import models,base
from app.services.interview_service import generate_all_quiz_pools
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
import uuid
import datetime
import json

router = APIRouter()

# In-memory lock: prevent duplicate generation workers per user
_generation_in_progress: set = set()


async def init_quiz_pool_worker(user_id: str, user_profile: dict, db_session_factory):
    """
    Background worker: generates all 30 questions in ONE API call, 
    then saves them to the database for all 3 quiz types.
    """
    try:
        print(f"[DEBUG] Generating all 30 questions (Technical + Aptitude + HR) for user {user_id}")
        all_questions = await generate_all_quiz_pools(user_profile)
        
        # Need a fresh session in the worker
        db = db_session_factory()
        try:
            saved_types = []
            for quiz_type, questions in all_questions.items():
                # Ensure it is a list
                if isinstance(questions, str):
                    questions = json.loads(questions)
                
                pool = db.query(models.QuizPool).filter(
                    models.QuizPool.userId == user_id,
                    models.QuizPool.interviewType == quiz_type
                ).first()
                
                if pool:
                    pool.questions = questions
                    pool.updatedAt = datetime.datetime.utcnow()
                    flag_modified(pool, "questions")
                else:
                    pool = models.QuizPool(
                        id=str(uuid.uuid4()),
                        userId=user_id,
                        questions=questions,
                        interviewType=quiz_type
                    )
                    db.add(pool)
                
                saved_types.append(quiz_type)
            
            db.commit()
            print(f"[DEBUG] Successfully saved all quiz pools for user {user_id}: {saved_types}")
        except Exception as e:
            db.rollback()
            print(f"[ERROR] Database error saving quiz pools: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"[ERROR] AI Generation failed for all quiz pools: {e}")
    finally:
        # Always release the lock when done
        _generation_in_progress.discard(user_id)


@router.post("/start")
async def start_interview(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Start quiz pool generation. Returns immediately - generation happens in background."""
    from app.db.base import SessionLocal
    
    user_id = current_user.id
    
    # Prevent duplicate generation workers
    if user_id in _generation_in_progress:
        return {
            "status": "Quiz generation already in progress. Please wait...",
            "type": "Mixed"
        }
    
    # Check if all three pools already exist and are fresh (< 24 hours old)
    existing_pools = db.query(models.QuizPool).filter(
        models.QuizPool.userId == user_id
    ).all()
    existing_types = {p.interviewType for p in existing_pools}
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    all_fresh = (
        {"Technical", "Aptitude", "HR"}.issubset(existing_types) and
        all(p.updatedAt and p.updatedAt > cutoff for p in existing_pools if p.interviewType in {"Technical", "Aptitude", "HR"})
    )
    
    if all_fresh:
        return {
            "status": "Quiz pool is fresh. Click any quiz type to start.",
            "type": "Mixed"
        }
    
    # Build full user profile for personalized questions
    user_profile = {
        "industry": current_user.industry or "Technology",
        "specialization": current_user.specialization or current_user.branch,
        "experience": current_user.experience,
        "currentYear": current_user.currentYear,
        "degree": current_user.degree,
        "isGraduated": current_user.isGraduated,
        "userType": current_user.userType,
        "skills": current_user.skills or [],
    }
    
    # Register lock before firing background task
    _generation_in_progress.add(user_id)
    
    background_tasks.add_task(
        init_quiz_pool_worker,
        user_id,
        user_profile,
        SessionLocal
    )
    return {
        "status": "Generating your personalized interview pool (Technical, Aptitude, HR)...",
        "type": "Mixed"
    }


@router.get("/questions/{interview_type}")
async def get_questions(
    interview_type: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    pool = db.query(models.QuizPool).filter(
        models.QuizPool.userId == current_user.id,
        models.QuizPool.interviewType == interview_type
    ).first()
    
    if not pool:
        raise HTTPException(status_code=404, detail="Quiz pool not found. Please start generation.")
    
    return pool.questions


@router.get("/pool/status")
async def get_pool_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Check which quiz types are ready in the pool and if generation is in progress."""
    types = ["Technical", "Aptitude", "HR"]
    status = {}
    for quiz_type in types:
        pool = db.query(models.QuizPool).filter(
            models.QuizPool.userId == current_user.id,
            models.QuizPool.interviewType == quiz_type
        ).first()
        status[quiz_type] = {
            "ready": pool is not None,
            "questionCount": len(pool.questions) if pool and pool.questions else 0,
            "updatedAt": pool.updatedAt.isoformat() if pool and pool.updatedAt else None
        }
    status["generatingNow"] = current_user.id in _generation_in_progress
    return status


@router.post("/assessment")
async def save_assessment(
    data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    # data has: quizData, answers, score, type
    quiz_data = data.get("quizData")
    if isinstance(quiz_data, str):
        try:
            quiz_data = json.loads(quiz_data)
        except Exception as e:
            print(f"[ERROR] Failed to parse quizData string: {e}")
            
    new_assessment = models.Assessment(
        id=str(uuid.uuid4()),
        userId=current_user.id,
        quizScore=data.get("score"),
        questions=quiz_data,
        category=data.get("type"),
        improvementTip="Assessment completed successfully. Well done!",
        interviewType=data.get("type"),
        createdAt=datetime.datetime.utcnow()
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment


@router.get("/assessments")
@router.get("/assessments/")
async def get_assessments(current_user: models.User = Depends(get_current_user), db: Session = Depends(base.get_db)):
    """Fetch all assessments for the current user, ordered by creation date."""
    assessments = db.query(models.Assessment).filter(
        models.Assessment.userId == current_user.id
    ).order_by(models.Assessment.createdAt.desc()).all()
    
    return assessments


@router.get("/test")
async def test_interview():
    return {"status": "interview api is working"}