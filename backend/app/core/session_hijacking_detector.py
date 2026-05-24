from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.core.app_logger import get_security_logger
from app.models.security_incident import SecurityIncident


SESSION_HIJACKING_DUPLICATE_COOLDOWN_SECONDS = 300

SESSION_CHANGE_WINDOW_SECONDS = 300


security_logger = get_security_logger()


_session_lock = Lock()

_user_sessions: Dict[int, dict] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _recent_session_hijacking_incident_exists(
    db: Session,
    user_id: int,
    ip_address: str,
) -> bool:
    cooldown_start = _now() - timedelta(
        seconds=SESSION_HIJACKING_DUPLICATE_COOLDOWN_SECONDS
    )

    incident = (
        db.query(SecurityIncident)
        .filter(
            SecurityIncident.incident_type == "Session Hijacking Attempt",
            SecurityIncident.user_id == user_id,
            SecurityIncident.ip_address == ip_address,
            SecurityIncident.created_at >= cooldown_start,
            SecurityIncident.status == "OPEN",
        )
        .first()
    )

    return incident is not None


def _create_session_hijacking_incident(
    db: Session,
    user_id: int,
    ip_address: str,
    username_or_email: Optional[str],
    reason: str,
    old_ip: Optional[str],
    new_ip: str,
    old_user_agent: Optional[str],
    new_user_agent: str,
    path: str,
    method: str,
) -> Optional[SecurityIncident]:
    if _recent_session_hijacking_incident_exists(
        db=db,
        user_id=user_id,
        ip_address=ip_address,
    ):
        security_logger.warning(
            f"SESSION HIJACKING blocked without duplicate incident | "
            f"user_id={user_id} | ip={ip_address} | reason={reason} | "
            f"method={method} | path={path}"
        )

        return None

    description = (
        f"Обнаружена возможная попытка угона сессии. "
        f"Причина: {reason}. "
        f"User ID: {user_id}. "
        f"Старый IP: {old_ip or '-'}. "
        f"Новый IP: {new_ip}. "
        f"Старый User-Agent: {old_user_agent or '-'}. "
        f"Новый User-Agent: {new_user_agent}. "
        f"Запрос: {method} {path}."
    )

    incident = SecurityIncident(
        user_id=user_id,
        incident_type="Session Hijacking Attempt",
        severity="CRITICAL",
        ip_address=ip_address,
        username_or_email=username_or_email,
        description=description,
        status="OPEN",
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    security_logger.critical(
        f"SESSION HIJACKING ATTEMPT BLOCKED | "
        f"incident_id={incident.id} | "
        f"user_id={user_id} | "
        f"ip={ip_address} | "
        f"reason={reason} | "
        f"method={method} | "
        f"path={path}"
    )

    return incident


def analyze_session_activity(
    db: Session,
    user_id: int,
    ip_address: str,
    user_agent: str,
    path: str,
    method: str,
    username_or_email: Optional[str] = None,
) -> bool:
    """
    Возвращает True, если запрос подозрительный и должен быть заблокирован.
    Возвращает False, если запрос нормальный.
    """

    now = _now()

    with _session_lock:
        previous_session = _user_sessions.get(user_id)

        if not previous_session:
            _user_sessions[user_id] = {
                "ip_address": ip_address,
                "user_agent": user_agent,
                "last_seen": now,
            }

            return False

        old_ip = previous_session.get("ip_address")
        old_user_agent = previous_session.get("user_agent")
        last_seen = previous_session.get("last_seen")

        time_difference = now - last_seen

        user_agent_changed = old_user_agent != user_agent
        ip_changed = old_ip != ip_address

        is_recent_session = time_difference <= timedelta(
            seconds=SESSION_CHANGE_WINDOW_SECONDS
        )

        if user_agent_changed and is_recent_session:
            reason = "User-Agent changed during active session"

            _create_session_hijacking_incident(
                db=db,
                user_id=user_id,
                ip_address=ip_address,
                username_or_email=username_or_email,
                reason=reason,
                old_ip=old_ip,
                new_ip=ip_address,
                old_user_agent=old_user_agent,
                new_user_agent=user_agent,
                path=path,
                method=method,
            )

            return True

        if ip_changed and user_agent_changed:
            reason = "IP address and User-Agent changed"

            _create_session_hijacking_incident(
                db=db,
                user_id=user_id,
                ip_address=ip_address,
                username_or_email=username_or_email,
                reason=reason,
                old_ip=old_ip,
                new_ip=ip_address,
                old_user_agent=old_user_agent,
                new_user_agent=user_agent,
                path=path,
                method=method,
            )

            return True

        previous_session["ip_address"] = ip_address
        previous_session["user_agent"] = user_agent
        previous_session["last_seen"] = now

        return False