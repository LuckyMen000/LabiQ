from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, check_database_connection
from app.models.user import User
from app.views.auth_view import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LabIQ API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "LabIQ API is running"
    }


@app.get("/api/health")
def health_check():
    db_status = check_database_connection()

    return {
        "status": "ok",
        "project": "LabIQ",
        "backend": "FastAPI",
        "database": "connected" if db_status else "error"
    }