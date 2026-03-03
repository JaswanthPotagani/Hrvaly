from fastapi import APIRouter, Depends , HTTPException, Request
from sqlalchemy.orm import Session
import os
from app.api.deps import get_current_user
from app.db import models, base
from app.services.subscription_service import create_razorpay_order, verify_payment_signature

router = APIRouter()

@router.post("/create-order")
async def start_subscription(plan_type: str, currency_user: models.User = Depends(get_current_user), db: Session = Depends(base.get_db)):
    
    amount = 499 if plan_type == "PRO" else 0
    if amount == 0:
        return {"order_id": None, "amount": 0}
        
    order = create_razorpay_order(amount)
    return {
        "order_id": order["id"],
        "amount" : order["amount"],
        "key": os.getenv("RAZORPAY_KEY_ID")
    }

@router.post("/verify")
async def verify_subscription(
    data: dict,
    currency_user: models.User = Depends(get_current_user),
    db: Session =  Depends(base.get_db)
):

    if verify_payment_signature(data):

        user = db.query(models.User).filter(models.User.id == currency_user.id).first()
        user.plan ="PRO"
        user.razorpaySubscriptionId = data.get("razorpay_payment_id")
        db.commit()
        return {"status" : "success"}
    
    raise HTTPException(status_code = 400 , detail="Invalid payment signature")