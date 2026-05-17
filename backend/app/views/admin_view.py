from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.audit_logger import create_audit_log
from app.core.role_checker import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.auth_log import AuthLog
from app.models.security_incident import SecurityIncident
from app.models.user import User
from app.schemas.admin_schema import (
    AdminStatsResponse,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    UnifiedLogResponse,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users_count = db.query(User).count()
    active_users_count = db.query(User).filter(User.is_active == True).count()
    inactive_users_count = db.query(User).filter(User.is_active == False).count()

    auth_logs_count = db.query(AuthLog).count()
    success_login_count = db.query(AuthLog).filter(AuthLog.status == "SUCCESS").count()
    failed_login_count = db.query(AuthLog).filter(AuthLog.status == "FAILED").count()
    forbidden_login_count = db.query(AuthLog).filter(AuthLog.status == "FORBIDDEN").count()

    audit_logs_count = db.query(AuditLog).count()
    security_incidents_count = db.query(SecurityIncident).count()

    return {
        "users_count": users_count,
        "active_users_count": active_users_count,
        "inactive_users_count": inactive_users_count,
        "auth_logs_count": auth_logs_count,
        "success_login_count": success_login_count,
        "failed_login_count": failed_login_count,
        "forbidden_login_count": forbidden_login_count,
        "audit_logs_count": audit_logs_count,
        "security_incidents_count": security_incidents_count,
    }


@router.get("/logs", response_model=list[UnifiedLogResponse])
def get_admin_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    unified_logs = []

    auth_logs = (
        db.query(AuthLog)
        .order_by(AuthLog.created_at.desc())
        .limit(300)
        .all()
    )

    for log in auth_logs:
        location = ", ".join(
            item for item in [log.country, log.region, log.city] if item
        )

        unified_logs.append({
            "id": len(unified_logs) + 1,
            "source_id": log.id,
            "log_type": "AUTH",
            "action": log.status,
            "actor": log.username_or_email,
            "target": None,
            "ip_address": log.ip_address,
            "location": location or None,
            "message": log.message,
            "severity": None,
            "status": log.status,
            "user_agent": log.user_agent,
            "created_at": log.created_at,
        })

    audit_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(300)
        .all()
    )

    for log in audit_logs:
        actor_email = log.actor.email if log.actor else None
        target_email = log.target.email if log.target else None

        unified_logs.append({
            "id": len(unified_logs) + 1,
            "source_id": log.id,
            "log_type": "ADMIN_USER",
            "action": log.action,
            "actor": actor_email,
            "target": target_email,
            "ip_address": log.ip_address,
            "location": None,
            "message": log.description,
            "severity": None,
            "status": None,
            "user_agent": log.user_agent,
            "created_at": log.created_at,
        })

    security_incidents = (
        db.query(SecurityIncident)
        .order_by(SecurityIncident.created_at.desc())
        .limit(300)
        .all()
    )

    for incident in security_incidents:
        unified_logs.append({
            "id": len(unified_logs) + 1,
            "source_id": incident.id,
            "log_type": "SECURITY_INCIDENT",
            "action": incident.incident_type,
            "actor": incident.username_or_email,
            "target": None,
            "ip_address": incident.ip_address,
            "location": None,
            "message": incident.description,
            "severity": incident.severity,
            "status": incident.status,
            "user_agent": None,
            "created_at": incident.created_at,
        })

    unified_logs.sort(
        key=lambda item: item["created_at"],
        reverse=True
    )

    for index, log in enumerate(unified_logs, start=1):
        log["id"] = index

    return unified_logs[:300]


@router.get("/users", response_model=list[AdminUserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    return users


@router.post(
    "/users",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_admin_user(
    user_data: AdminUserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    existing_username = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким username уже существует"
        )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_active=user_data.is_active,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(
        db=db,
        action="USER_CREATED",
        entity="user",
        actor_user_id=current_user.id,
        target_user_id=new_user.id,
        description=f"Администратор {current_user.email} создал пользователя {new_user.email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return new_user


@router.put("/users/{user_id}", response_model=AdminUserResponse)
def update_admin_user(
    user_id: int,
    user_data: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    old_email = user.email

    if user_data.email is not None:
        existing_email = (
            db.query(User)
            .filter(User.email == user_data.email, User.id != user_id)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )

        user.email = user_data.email

    if user_data.username is not None:
        existing_username = (
            db.query(User)
            .filter(User.username == user_data.username, User.id != user_id)
            .first()
        )

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким username уже существует"
            )

        user.username = user_data.username

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)

    if user_data.role is not None:
        user.role = user_data.role

    if user_data.is_active is not None:
        if user.id == current_user.id and user_data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя деактивировать самого себя"
            )

        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        action="USER_UPDATED",
        entity="user",
        actor_user_id=current_user.id,
        target_user_id=user.id,
        description=f"Администратор {current_user.email} изменил пользователя {old_email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return user


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя"
        )

    deleted_user_id = user.id
    deleted_user_email = user.email

    db.delete(user)
    db.commit()

    create_audit_log(
        db=db,
        action="USER_DELETED",
        entity="user",
        actor_user_id=current_user.id,
        target_user_id=deleted_user_id,
        description=f"Администратор {current_user.email} удалил пользователя {deleted_user_email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {
        "message": "Пользователь успешно удалён"
    }


@router.get("/settings")
def get_admin_settings(
    current_user: User = Depends(require_admin),
):
    return {
        "maintenance_mode": False,
        "registration_enabled": True,
        "system_name": "LabIQ"
    }