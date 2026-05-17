from fastapi import HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth_logger import create_auth_log
from app.core.rate_limit import (
    check_login_rate_limit,
    get_client_ip,
    register_failed_login_attempt,
    reset_login_attempts,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest


class AuthController:
    @staticmethod
    def register_user(payload: RegisterRequest, db: Session) -> AuthResponse:
        existing_user = db.query(User).filter(
            or_(
                User.email == payload.email.lower().strip(),
                User.username == payload.username.lower().strip()
            )
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Пользователь с таким email или username уже существует"
            )

        new_user = User(
            full_name=payload.full_name.strip(),
            email=payload.email.lower().strip(),
            username=payload.username.lower().strip(),
            hashed_password=hash_password(payload.password),
            role="Лаборант",
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token = create_access_token({
            "sub": str(new_user.id),
            "username": new_user.username,
            "role": new_user.role
        })

        return AuthResponse(
            access_token=access_token,
            user=new_user
        )

    @staticmethod
    def login_user(
        payload: LoginRequest,
        db: Session,
        request: Request
    ) -> AuthResponse:
        ip_address = get_client_ip(request)

        check_login_rate_limit(db=db, ip_address=ip_address)

        login_value = payload.username_or_email.lower().strip()

        user = db.query(User).filter(
            or_(
                User.email == login_value,
                User.username == login_value
            )
        ).first()

        if not user:
            register_failed_login_attempt(db=db, ip_address=ip_address)

            create_auth_log(
                db=db,
                request=request,
                username_or_email=login_value,
                status="FAILED",
                message="Неверный логин или пароль"
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        if not verify_password(payload.password, user.hashed_password):
            register_failed_login_attempt(db=db, ip_address=ip_address)

            create_auth_log(
                db=db,
                request=request,
                username_or_email=login_value,
                status="FAILED",
                message="Неверный логин или пароль"
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        if not user.is_active:
            create_auth_log(
                db=db,
                request=request,
                username_or_email=login_value,
                status="FORBIDDEN",
                message="Попытка входа в деактивированный аккаунт"
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Пользователь деактивирован"
            )

        reset_login_attempts(db=db, ip_address=ip_address)

        create_auth_log(
            db=db,
            request=request,
            username_or_email=login_value,
            status="SUCCESS",
            message="Успешный вход"
        )

        access_token = create_access_token({
            "sub": str(user.id),
            "username": user.username,
            "role": user.role
        })

        return AuthResponse(
            access_token=access_token,
            user=user
        )