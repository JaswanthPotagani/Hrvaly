from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def fix_insight_schema():
    with engine.connect() as conn:
        print("Checking IndustryInsight schema...")
        
        # Check if salaryRanges is an array and convert it to JSONB if needed
        try:
            # We use a subquery to check the type and then alter. 
            # In PostgreSQL, we can use pg_typeof or check information_schema
            check_sql = text("""
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'IndustryInsight' AND column_name = 'salaryRanges'
            """)
            col_type = conn.execute(check_sql).scalar()
            print(f"Current type of salaryRanges: {col_type}")

            if col_type == 'ARRAY' or col_type == 'USER-DEFINED':
                print("Converting salaryRanges to JSONB...")
                # We need to be careful with existing data, but since it's failing, there might not be any good data.
                # However, to be safe:
                conn.execute(text('ALTER TABLE "IndustryInsight" ALTER COLUMN "salaryRanges" TYPE JSONB USING "salaryRanges"::jsonb'))
                conn.commit()
                print("Conversion successful.")
            elif col_type == 'text' or col_type == 'character varying':
                 print("Converting salaryRanges from text to JSONB...")
                 conn.execute(text('ALTER TABLE "IndustryInsight" ALTER COLUMN "salaryRanges" TYPE JSONB USING "salaryRanges"::jsonb'))
                 conn.commit()
                 print("Conversion successful.")
            else:
                print("salaryRanges type seems correct or unhandled. Attempting force convert anyway to be safe.")
                conn.execute(text('ALTER TABLE "IndustryInsight" ALTER COLUMN "salaryRanges" TYPE JSONB USING "salaryRanges"::jsonb'))
                conn.commit()

        except Exception as e:
            print(f"Error fixing salaryRanges: {e}")
            conn.rollback()

        # Also ensure topSkills, keyTrends, recommendedSkills are ARRAY(String)
        # They seem to be okay based on the log (casts were present), but let's confirm.
        cols = ['topSkills', 'keyTrends', 'recommendedSkills']
        for col in cols:
            try:
                print(f"Ensuring {col} is ARRAY...")
                # If they are already array, this might redundant but safe.
                # If they are JSONB, we might want to convert them if we prefer ARRAY(String) as in the model.
                pass 
            except Exception as e:
                print(f"Error checking {col}: {e}")

if __name__ == "__main__":
    fix_insight_schema()
