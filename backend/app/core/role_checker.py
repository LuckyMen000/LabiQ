from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User


ADMIN_ROLE = "Администратор"


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуются права администратора.",
        )

    return current_user