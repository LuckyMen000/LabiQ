import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.app_logger import setup_logging, get_app_logger
from app.database import Base, check_database_connection, engine

from app.models.audit_log import AuditLog
from app.models.auth_log import AuthLog
from app.models.login_attempt import LoginAttempt
from app.models.security_incident import SecurityIncident
from app.models.user import User

from app.middleware.dns_poisoning_protection_middleware import (
    DNSPoisoningProtectionMiddleware,
)
from app.middleware.request_logging_middleware import RequestLoggingMiddleware
from app.middleware.rce_protection_middleware import RCEProtectionMiddleware
from app.middleware.security_monitor_middleware import SecurityMonitorMiddleware
from app.middleware.sql_injection_protection_middleware import (
    SQLInjectionProtectionMiddleware,
)

from app.views.admin_view import router as admin_router
from app.views.auth_view import router as auth_router
from app.views.log_management_view import router as log_management_router
from app.views.security_incident_catalog_view import (
    router as security_incident_catalog_router,
)
from app.views.user_view import router as user_router


setup_logging()

app_logger = get_app_logger()


app = FastAPI(
    title="LabIQ API",
    version="0.0.1",
    description="Laboratory Information & Analytics System API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityMonitorMiddleware)
app.add_middleware(RCEProtectionMiddleware)
app.add_middleware(SQLInjectionProtectionMiddleware)
app.add_middleware(DNSPoisoningProtectionMiddleware)


os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("logs", exist_ok=True)


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(user_router)
app.include_router(log_management_router)
app.include_router(security_incident_catalog_router)


@app.get("/")
def root():
    app_logger.info("Root endpoint called")

    return {
        "message": "LabIQ API is running",
    }


@app.get("/health")
def health_check():
    db_status = check_database_connection()

    app_logger.info(
        f"Health check called | database={'connected' if db_status else 'error'}"
    )

    return {
        "status": "ok",
        "project": "LabIQ",
        "backend": "FastAPI",
        "database": "connected" if db_status else "error",
    }