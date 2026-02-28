from fastapi import FastAPI
from app.db.base import engine
from app.db import models
from app.api.v1 import user, resume , applications,dashboard

app = FastAPI()

app.include_router(user.router, prefix="/api/v1/user", tags=["user"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["resume"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])


@app.get("/health")
def health_check():
    return {"status": "online","database":"connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)