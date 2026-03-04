import asyncio
from app.db import base
from sqlalchemy import text
import os

async def update_schema():
    db = next(base.get_db())
    
    # List of columns to add with their SQL types
    columns_to_add = [
        ("onboarded", "BOOLEAN DEFAULT FALSE"),
        ("bannedAt", "TIMESTAMP"),
        ("failedLoginAttempts", "INTEGER DEFAULT 0"),
        ("referralCode", "VARCHAR"),
        ("weakAreas", "TEXT[]"),
        ("decisionQuality", "JSONB DEFAULT '{}'::jsonb"),
        ("secretInsight", "VARCHAR")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            # Check if column exists
            result = db.execute(text(f"""
                SELECT count(*) 
                FROM information_schema.columns 
                WHERE table_name='User' AND column_name='{col_name}'
            """)).scalar()
            
            if result == 0:
                print(f"Adding column {col_name} to User table...")
                db.execute(text(f'ALTER TABLE "User" ADD COLUMN "{col_name}" {col_type}'))
                db.commit()
                print(f"Column {col_name} added successfully.")
            else:
                print(f"Column {col_name} already exists.")
        except Exception as e:
            print(f"Error adding column {col_name}: {e}")
            db.rollback()

if __name__ == "__main__":
    asyncio.run(update_schema())
