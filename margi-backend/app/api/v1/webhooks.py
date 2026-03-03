from fastapi import APIRouter, Request, Header, HTTPException, Depends
from app.db import models, base
from sqlalchemy.orm import Session
import json

router = APIRouter()


@router.post("/razorpay")
async def razorpay_webhook( request :Request , x_razorpay_signature: str = Header(None), db: Session = Depends(base.get_db)):
    body = await request.body()

    event_data = json.loads(body)

    event_id = event_data.get("id")

    if db.query(models.ProcessedWebhook).filter_by(id=event_id).first():
        return {"status" : "already_processed"}

    
    new_webhook = models.ProcessedWebhook(id=event_id)
    db.add(new_webhook)
    db.commit()

    return {"status": "ok"}