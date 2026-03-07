from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_user
from app.db import models, base
from app.services.voice_service import start_voice_interview, generate_voice_turn, evaluate_voice_response
from sqlalchemy.orm import Session
import uuid
import datetime
import json

router = APIRouter()


@router.post("/start")
async def start_voice_session(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Start a new voice interview session. Returns the AI's greeting + first question."""
    industry = current_user.industry or "Technology"
    skills = current_user.skills or []
    
    # Build user context for personalized questions
    user_type = current_user.userType or "student"
    experience = current_user.experience
    specialization = current_user.specialization or current_user.branch
    
    if user_type == "professional" and experience:
        user_context = f"a professional with {experience} years in {industry}"
    elif current_user.currentYear:
        year_map = {1: "1st year", 2: "2nd year", 3: "3rd year", 4: "4th year"}
        year = year_map.get(current_user.currentYear, f"year {current_user.currentYear}")
        user_context = f"a {year} student pursuing {current_user.degree or 'a degree'} in {specialization or industry}"
    else:
        user_context = f"a candidate in the {industry} field"
    
    try:
        result = await start_voice_interview(industry, skills, user_context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start voice interview: {str(e)}")


@router.post("/turn")
async def voice_turn(
    data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Process one conversation turn. Returns next AI response + updated history."""
    history = data.get("history", [])
    user_response = data.get("userResponse", "")
    industry = current_user.industry or "Technology"
    
    if not user_response:
        raise HTTPException(status_code=400, detail="userResponse is required")
    
    try:
        result = await generate_voice_turn(history, user_response, industry)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.post("/save")
async def save_voice_assessment(
    data: dict = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Save completed voice assessment to the database."""
    result_data = data.get("result", {})
    input_hash = data.get("inputHash", "")
    
    # Check for duplicate using inputHash
    if input_hash:
        existing = db.query(models.VoiceAssessment).filter(
            models.VoiceAssessment.userId == current_user.id,
            models.VoiceAssessment.inputHash == input_hash
        ).first()
        if existing:
            return existing
    
    questions = result_data.get("questions", [])
    if isinstance(questions, str):
        try:
            questions = json.loads(questions)
        except Exception:
            pass
    
    new_assessment = models.VoiceAssessment(
        id=str(uuid.uuid4()),
        userId=current_user.id,
        quizScore=float(result_data.get("score", 0)),
        questions=questions,
        category="Voice",
        improvementTip="; ".join(result_data.get("tips", [])) if isinstance(result_data.get("tips"), list) else str(result_data.get("tips", "")),
        inputHash=input_hash,
        createdAt=datetime.datetime.utcnow()
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment


@router.get("/assessments")
async def get_voice_assessments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Get all voice assessments for the current user."""
    assessments = db.query(models.VoiceAssessment).filter(
        models.VoiceAssessment.userId == current_user.id
    ).order_by(models.VoiceAssessment.createdAt.desc()).all()
    return assessments


@router.post("/submit")
async def submit_voice_interview(
    data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(base.get_db)
):
    """Legacy: submit voice responses for evaluation."""
    assessment_id = str(uuid.uuid4())
    new_assessment = models.VoiceAssessment(
        id=assessment_id,
        userId=current_user.id,
        quizScore=0.0,
        questions=data.get("responses", []),
        category="Voice"
    )
    db.add(new_assessment)
    db.commit()
    return {"id": assessment_id, "status": "evaluating"}
