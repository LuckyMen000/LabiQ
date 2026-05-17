from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.role_checker import require_admin
from app.database import get_db
from app.models.auth_log import AuthLog
from app.models.user import User
from app.schemas.admin_schema import (
    AdminLogResponse,
    AdminStatsResponse,
    AdminUserResponse,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users_total = db.query(User).count()
    users_active = db.query(User).filter(User.is_active == True).count()
    users_inactive = db.query(User).filter(User.is_active == False).count()
    admins_total = db.query(User).filter(User.role == "Администратор").count()

    auth_logs_total = db.query(AuthLog).count()
    successful_logins = db.query(AuthLog).filter(AuthLog.status == "SUCCESS").count()
    failed_logins = db.query(AuthLog).filter(AuthLog.status == "FAILED").count()

    return AdminStatsResponse(
        users_total=users_total,
        users_active=users_active,
        users_inactive=users_inactive,
        admins_total=admins_total,
        auth_logs_total=auth_logs_total,
        successful_logins=successful_logins,
        failed_logins=failed_logins,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.id.desc()).all()
    return users


@router.get("/logs", response_model=list[AdminLogResponse])
def get_admin_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    logs = db.query(AuthLog).order_by(AuthLog.created_at.desc()).limit(100).all()
    return logs


@router.get("/settings")
def get_admin_settings(
    current_user: User = Depends(require_admin),
):
    return {
        "app_name": "LabIQ",
        "admin_panel_enabled": True,
        "version": "1.0.0",
    }