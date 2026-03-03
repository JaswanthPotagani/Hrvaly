from fastapi import FastAPI
from app.db.base import engine
from app.db import models
from app.api.v1 import user, resume , applications,dashboard,interview,voice,insights,achievements,admin,payments,webhooks

app = FastAPI()

app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["resume"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])
app.include_router(interview.router, prefix="/api/v1/interview",tags=["Interview"])
app.include_router(voice.router,prefix="/api/v1/voice" , tags=["Voice Interview"])
app.include_router(insights.router,prefix="/api/v1/insights", tags=["Industry Insights"])
app.include_router(achievements.router, prefix="/api/v1/achievements",tags=["Achievements"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin & Security"])
app.include_router(payments.router, prefix="/api/v1/payments" , tags=["Payments"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks" , tags=["Webhooks"])


@app.get("/health")
def health_check():
    return {"status": "online","database":"connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)