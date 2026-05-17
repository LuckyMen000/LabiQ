from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.role_checker import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.models.auth_log import AuthLog
from app.schemas.admin_schema import (
    AdminStatsResponse,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    AuthLogResponse,
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

    return {
        "users_count": users_count,
        "active_users_count": active_users_count,
        "inactive_users_count": inactive_users_count,
        "auth_logs_count": auth_logs_count,
        "success_login_count": success_login_count,
        "failed_login_count": failed_login_count,
        "forbidden_login_count": forbidden_login_count,
    }


@router.get("/logs", response_model=list[AuthLogResponse])
def get_admin_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    logs = (
        db.query(AuthLog)
        .order_by(AuthLog.created_at.desc())
        .limit(100)
        .all()
    )

    return logs


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

    return new_user


@router.put("/users/{user_id}", response_model=AdminUserResponse)
def update_admin_user(
    user_id: int,
    user_data: AdminUserUpdate,
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

    return user


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: int,
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

    db.delete(user)
    db.commit()

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