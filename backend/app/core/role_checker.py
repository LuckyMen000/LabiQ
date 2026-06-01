from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.core.roles import (
    ADMIN_ROLES,
    SECURITY_ROLES,
    LAB_ROLES,
    REGISTRATION_ROLES,
    REPORT_ROLES,
    SUPER_ADMIN,
)
from app.models.user import User


def require_roles(allowed_roles: list[str]):
    def checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещён. Недостаточно прав.",
            )

        return current_user

    return checker


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права администратора.",
        )

    return current_user


def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права супер администратора.",
        )

    return current_user


def require_security_access(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in SECURITY_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права доступа к ИБ.",
        )

    return current_user


def require_lab_access(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in LAB_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права лаборатории.",
        )

    return current_user


def require_registration_access(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права регистратора.",
        )

    return current_user


def require_report_access(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in REPORT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права доступа к отчётам.",
        )

    return current_user