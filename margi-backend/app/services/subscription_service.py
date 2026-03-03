import razorpay
import os
from sqlalchemy.orm import Session
from app.db import models

client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

def create_razorpay_order(amount: int, currency: str = "INR"):
    """
    Creates a new order in Razorpay
    """

    date ={
        "amount": amount * 100,
        "currency": currency,
        "receipt": "receipt_order_1"
    }

    return client.order.create(data=data)

def verify_payment_signature(params: dict):
    """
    Verifies the signature sent by Razorpay after successful payment.
    """

    try:
        return client.utility.verify.verify_payment_signature(params)
    except Exception:
        return False