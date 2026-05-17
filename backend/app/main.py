from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, check_database_connection, engine

from app.models.user import User
from app.models.login_attempt import LoginAttempt
from app.models.auth_log import AuthLog

from app.views.auth_view import router as auth_router
from app.views.admin_view import router as admin_router

app = FastAPI(
    title="LabIQ API",
    version="0.0.1",
    description="Laboratory Information & Analytics System API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.31.123:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "LabIQ API is running"
    }


@app.get("/health")
def health_check():
    db_status = check_database_connection()

    return {
        "status": "ok",
        "project": "LabIQ",
        "backend": "FastAPI",
        "database": "connected" if db_status else "error"
    }