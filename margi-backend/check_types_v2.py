from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # List all tables to confirm names
    tables = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")).fetchall()
    print("Tables in public schema:")
    for t in tables:
        print(f" - {t[0]}")
    
    # Check columns for IndustryInsight (case-insensitive search)
    possible_names = ['IndustryInsight', 'industryinsight', 'Industry_Insight']
    for name in possible_names:
        result = conn.execute(text(f"""
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = '{name}'
        """)).fetchall()
        if result:
            print(f"\nProperties for table: {name}")
            for row in result:
                print(f"Column: {row.column_name}, Type: {row.data_type}, UDT: {row.udt_name}")
            break
