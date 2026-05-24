from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.app_logger import clear_log_files, get_audit_logger
from app.core.security import get_current_user
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.auth_log import AuthLog
from app.models.security_incident import SecurityIncident
from app.models.user import User


router = APIRouter(
    prefix="/admin/log-management",
    tags=["Admin Log Management"],
)

audit_logger = get_audit_logger()


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["Администратор", "admin", "administrator"]:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения действия",
        )

    return current_user


@router.delete("/database")
def clear_database_logs(
    scope: str = Query(
        default="all",
        description="all | audit | auth | security",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deleted = {
        "audit_logs": 0,
        "auth_logs": 0,
        "security_incidents": 0,
    }

    if scope in ["all", "audit"]:
        deleted["audit_logs"] = db.query(AuditLog).delete()

    if scope in ["all", "auth"]:
        deleted["auth_logs"] = db.query(AuthLog).delete()

    if scope in ["all", "security"]:
        deleted["security_incidents"] = db.query(SecurityIncident).delete()

    db.commit()

    audit_logger.warning(
        f"Database logs cleared | scope={scope} | "
        f"admin_id={current_user.id} | "
        f"admin_email={current_user.email} | "
        f"deleted={deleted}"
    )

    return {
        "message": "Журнал логов успешно очищен",
        "scope": scope,
        "deleted": deleted,
    }


@router.delete("/files")
def clear_files_logs(
    current_user: User = Depends(require_admin),
):
    cleared_files = clear_log_files()

    audit_logger.warning(
        f"Log files cleared | "
        f"admin_id={current_user.id} | "
        f"admin_email={current_user.email} | "
        f"files={cleared_files}"
    )

    return {
        "message": "Файлы логов успешно очищены",
        "cleared_files": cleared_files,
    }


@router.delete("/all")
def clear_all_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deleted = {
        "audit_logs": db.query(AuditLog).delete(),
        "auth_logs": db.query(AuthLog).delete(),
        "security_incidents": db.query(SecurityIncident).delete(),
    }

    db.commit()

    cleared_files = clear_log_files()

    audit_logger.warning(
        f"All logs cleared | "
        f"admin_id={current_user.id} | "
        f"admin_email={current_user.email} | "
        f"deleted={deleted} | "
        f"files={cleared_files}"
    )

    return {
        "message": "Все логи успешно очищены",
        "deleted": deleted,
        "cleared_files": cleared_files,
    }