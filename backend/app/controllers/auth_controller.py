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
from app.core.security_incident_logger import create_security_incident
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
        login_value = payload.username_or_email.lower().strip()

        try:
            check_login_rate_limit(db=db, ip_address=ip_address)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                create_auth_log(
                    db=db,
                    request=request,
                    username_or_email=login_value,
                    status="BLOCKED",
                    message="Попытка входа с временно заблокированного IP-адреса"
                )

            raise exc

        user = db.query(User).filter(
            or_(
                User.email == login_value,
                User.username == login_value
            )
        ).first()

        if not user:
            _, is_blocked_now = register_failed_login_attempt(
                db=db,
                ip_address=ip_address
            )

            create_auth_log(
                db=db,
                request=request,
                username_or_email=login_value,
                status="FAILED",
                message="Неверный логин или пароль"
            )

            if is_blocked_now:
                create_auth_log(
                    db=db,
                    request=request,
                    username_or_email=login_value,
                    status="BLOCKED",
                    message="IP-адрес временно заблокирован из-за превышения лимита неудачных попыток входа"
                )

                create_security_incident(
                    db=db,
                    incident_type="BRUTE_FORCE_ATTEMPT",
                    severity="HIGH",
                    ip_address=ip_address,
                    username_or_email=login_value,
                    user_id=None,
                    description="Обнаружена brute-force атака: превышен лимит неудачных попыток входа.",
                    status="OPEN"
                )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        if not verify_password(payload.password, user.hashed_password):
            _, is_blocked_now = register_failed_login_attempt(
                db=db,
                ip_address=ip_address
            )

            create_auth_log(
                db=db,
                request=request,
                username_or_email=login_value,
                status="FAILED",
                message="Неверный логин или пароль"
            )

            if is_blocked_now:
                create_auth_log(
                    db=db,
                    request=request,
                    username_or_email=login_value,
                    status="BLOCKED",
                    message="IP-адрес временно заблокирован из-за превышения лимита неудачных попыток входа"
                )

                create_security_incident(
                    db=db,
                    incident_type="BRUTE_FORCE_ATTEMPT",
                    severity="HIGH",
                    ip_address=ip_address,
                    username_or_email=login_value,
                    user_id=user.id,
                    description="Обнаружена brute-force атака: превышен лимит неудачных попыток входа.",
                    status="OPEN"
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