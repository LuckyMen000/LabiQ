from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse


class AuthController:
    @staticmethod
    def register_user(payload: RegisterRequest, db: Session) -> AuthResponse:
        existing_user = db.query(User).filter(
            or_(
                User.email == payload.email,
                User.username == payload.username
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
    def login_user(payload: LoginRequest, db: Session) -> AuthResponse:
        login_value = payload.username_or_email.lower().strip()

        user = db.query(User).filter(
            or_(
                User.email == login_value,
                User.username == login_value
            )
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        if not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Пользователь деактивирован"
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