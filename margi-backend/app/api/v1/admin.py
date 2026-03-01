from fastapi import APIRouter, Depends, HTTPException,BackgroundTasks
from app.api.deps import get_current_user
from app.db import models, base
from app.core.redis import redis_client
from sqlalchemy.orm import Session
import secrets
from app.core.email import schedule_email
from app.core.templates import get_otp_template

router = APIRouter()

@router.post("/request-otp")
async def request_otp(email:str,background_tasks: BackgroundTasks, db:Session =Depends(base.get_db)):

    otp ="".join([str(secrets.randbelow(10)) for _ in range(6)])

    await redis_client.setex(f"otp:{email}" , 600, otp)

    schedule_email(background_tasks,email,"Your Verification Code", get_otp_template(otp))
    return {"message": "OTP sent to your email."}

@router.post("/verify-otp")
async def verify_otp(email: str, code:str):
    stored_otp = await redis_client.get(f"otp:{email}")

    if not stored_otp or stored_otp != code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    await redis_client.delete(f"otp:{email}")
    return {"message": "Verification successful"}

