import asyncio
from app.db import base, models
from sqlalchemy import inspect
import os

async def check_columns():
    db = next(base.get_db())
    inspector = inspect(base.engine)
    columns = [c['name'] for c in inspector.get_columns('User')]
    print(f"Columns in User table: {columns}")
    
    # Check if critical ones are missing
    required = ['onboarded', 'specialization', 'decisionQuality', 'learnabilityScore']
    missing = [r for r in required if r not in columns]
    if missing:
        print(f"MISSING COLUMNS: {missing}")
    else:
        print("All required columns present.")

if __name__ == "__main__":
    asyncio.run(check_columns())
