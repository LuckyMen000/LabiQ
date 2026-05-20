from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.login_attempt import LoginAttempt


def block_ip_address(
    db: Session,
    ip_address: str,
    block_seconds: int = 400,
    attempts_count: int = 3,
) -> LoginAttempt:
    now = datetime.now(timezone.utc)
    blocked_until = now + timedelta(seconds=block_seconds)

    login_attempt = db.query(LoginAttempt).filter(
        LoginAttempt.ip_address == ip_address
    ).first()

    if not login_attempt:
        login_attempt = LoginAttempt(
            ip_address=ip_address,
            attempts_count=attempts_count,
            blocked_until=blocked_until,
            last_attempt_at=now
        )

        db.add(login_attempt)
    else:
        login_attempt.attempts_count = attempts_count
        login_attempt.blocked_until = blocked_until
        login_attempt.last_attempt_at = now

    db.commit()
    db.refresh(login_attempt)

    return login_attempt


def unblock_ip_address(
    db: Session,
    ip_address: str,
) -> Optional[LoginAttempt]:
    login_attempt = db.query(LoginAttempt).filter(
        LoginAttempt.ip_address == ip_address
    ).first()

    if not login_attempt:
        return None

    login_attempt.attempts_count = 0
    login_attempt.blocked_until = None
    login_attempt.last_attempt_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(login_attempt)

    return login_attempt


def is_ip_blocked(
    db: Session,
    ip_address: str,
) -> bool:
    login_attempt = db.query(LoginAttempt).filter(
        LoginAttempt.ip_address == ip_address
    ).first()

    if not login_attempt or not login_attempt.blocked_until:
        return False

    now = datetime.now(timezone.utc)

    return login_attempt.blocked_until > now