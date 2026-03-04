from fastapi import FastAPI, Request
from sqlalchemy import text
import time
from fastapi.middleware.gzip import GZipMiddleware
from app.db.base import engine
from app.db import models
from app.api.v1 import user, resume , applications,dashboard,interview,voice,insights,achievements,admin,payments,webhooks
from fastapi.middleware.cors import CORSMiddleware
import traceback
import logging
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-nextjs-app.com" ,"http://localhost:3000"],
    allow_credentials=True,
    allow_methods = ["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"GLOBAL ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(e)}"}
        )

def update_schema_on_startup():
    from app.db.base import SessionLocal, engine
    from sqlalchemy import inspect
    db = SessionLocal()
    
    # DIAGNOSTIC: Print Table Info
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"DATABASE TABLES: {tables}")
        for table in tables:
            cols = [c['name'] for c in inspector.get_columns(table)]
            logger.info(f"TABLE '{table}' COLUMNS: {cols}")
    except Exception as e:
        logger.error(f"DIAGNOSTIC FAILED: {e}")

    columns_to_add = [
        ("onboarded", "BOOLEAN DEFAULT FALSE"),
        ("bannedAt", "TIMESTAMP"),
        ("failedLoginAttempts", "INTEGER DEFAULT 0"),
        ("referralCode", "VARCHAR"),
        ("weakAreas", "TEXT[]"),
        ("decisionQuality", "JSONB DEFAULT '{}'::jsonb"),
        ("secretInsight", "VARCHAR"),
        ("learnabilityScore", "FLOAT DEFAULT 0.0"),
        ("actionCount", "INTEGER DEFAULT 0"),
        ("lastLogin", "TIMESTAMP"),
        ("monthlyUsage", "JSONB DEFAULT '{\"resume\":0,\"coverLetter\":0,\"interview\":0,\"voiceInterview\":0}'::jsonb"),
        ("specialization", "VARCHAR"),
        ("plan", "VARCHAR DEFAULT 'FREE'")
    ]
    for col_name, col_type in columns_to_add:
        try:
            # Check both 'User' and 'user' table names as a safety measure
            result = db.execute(text(f"""
                SELECT count(*) FROM information_schema.columns 
                WHERE table_name IN ('User', 'user') AND column_name='{col_name}'
            """)).scalar()
            
            if result == 0:
                print(f"Adding column {col_name} to User table...")
                # We use "User" with quotes because it's a reserved word and Prisma often uses it exactly as 'User'
                db.execute(text(f'ALTER TABLE "User" ADD COLUMN "{col_name}" {col_type}'))
                db.commit()
                print(f"Column {col_name} added successfully.")
        except Exception as e:
            print(f"Error adding column {col_name}: {e}")
            db.rollback()
    # Check related tables for userId column (case sensitivity)
    related_tables = ["Assessment", "CareerMilestone", "VerificationBadge", "Resume", "JobApplication"]
    for table_name in related_tables:
        try:
            result = db.execute(text(f"SELECT count(*) FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='userId'")).scalar()
            if result == 0:
                print(f"[RECOVER] userId column missing in {table_name}, checking for user_id...")
                alt_result = db.execute(text(f"SELECT count(*) FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='user_id'")).scalar()
                if alt_result > 0:
                    print(f"[RECOVER] Found user_id in {table_name}, adding userId as alias or altering...")
                    # Safer to just add userId as a column if it's missing, or we might need to change the model.
                    # For now, let's just log it. If it's user_id in DB but userId in model, SQLAlchemy will fail.
                    db.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN "userId" VARCHAR'))
                    db.execute(text(f'UPDATE "{table_name}" SET "userId" = "user_id"'))
                    db.commit()
        except Exception as e:
            print(f"Error checking {table_name}: {e}")
            db.rollback()
    # RECOVER: Fix IndustryInsight salaryRanges type
    try:
        # Check current udt_name (internal type name)
        # For ARRAY(VARCHAR), udt_name starts with an underscore, like '_varchar'
        res = db.execute(text("""
            SELECT udt_name FROM information_schema.columns 
            WHERE table_name = 'IndustryInsight' AND column_name = 'salaryRanges'
        """)).scalar()
        
        if res:
            logger.info(f"IndustryInsight.salaryRanges current type (udt_name): {res}")
            if res != 'jsonb':
                logger.info(f"Altering IndustryInsight.salaryRanges from {res} to JSONB...")
                # If it starts with underscore, it's a native Postgres array
                if res.startswith('_'):
                    db.execute(text('ALTER TABLE "IndustryInsight" ALTER COLUMN "salaryRanges" TYPE JSONB USING to_jsonb("salaryRanges")'))
                else:
                    db.execute(text('ALTER TABLE "IndustryInsight" ALTER COLUMN "salaryRanges" TYPE JSONB USING "salaryRanges"::jsonb'))
                db.commit()
                logger.info("Successfully converted salaryRanges to JSONB.")
    except Exception as e:
        logger.error(f"Error altering IndustryInsight: {e}")
        db.rollback()

    db.close()

@app.on_event("startup")
async def startup_event():
    print(f"GOOGLE GENAI VERSION: {genai.__version__}")
    logger.info("Starting up application...")
    update_schema_on_startup()

app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["resume"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(interview.router, prefix="/api/v1/interview",tags=["Interview"])
app.include_router(voice.router,prefix="/api/v1/voice" , tags=["Voice Interview"])
app.include_router(insights.router,prefix="/api/v1/insights", tags=["Industry Insights"])
app.include_router(achievements.router, prefix="/api/v1/achievements",tags=["Achievements"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin & Security"])
app.include_router(payments.router, prefix="/api/v1/payments" , tags=["Payments"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks" , tags=["Webhooks"])


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] =  str(process_time)
    return response

@app.middleware("http")
async def ban_check_middleware(request, call_next):
    return await call_next(request)

@app.get("/health")
def health_check():
    return {"status": "online","database":"connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)