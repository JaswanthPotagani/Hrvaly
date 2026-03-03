import asyncio
from app.db import base, models
from sqlalchemy.orm import Session
import os

async def check():
    db = next(base.get_db())
    users = db.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for user in users:
        print(f"User: {user.email}, Industry: {user.industry}, Bio: {user.bio}")
    
    insights = db.query(models.IndustryInsight).all()
    print(f"Total Insights: {len(insights)}")
    for insight in insights:
        print(f"Insight ID: {insight.id}, Industry: {insight.industry}, Trends: {insight.keyTrends}")

if __name__ == "__main__":
    asyncio.run(check())
