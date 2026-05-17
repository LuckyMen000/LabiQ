from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.login_attempt import LoginAttempt


MAX_LOGIN_ATTEMPTS = 3
LOGIN_COOLDOWN_SECONDS = 400


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def check_login_rate_limit(db: Session, ip_address: str) -> None:
    login_attempt = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.ip_address == ip_address)
        .first()
    )

    if not login_attempt:
        return

    now = datetime.now(timezone.utc)

    if login_attempt.blocked_until and login_attempt.blocked_until > now:
        remaining_seconds = int((login_attempt.blocked_until - now).total_seconds())

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Слишком много попыток входа. Попробуйте позже через {remaining_seconds} сек."
        )

    if login_attempt.blocked_until and login_attempt.blocked_until <= now:
        login_attempt.attempts_count = 0
        login_attempt.blocked_until = None
        db.commit()


def register_failed_login_attempt(db: Session, ip_address: str) -> None:
    now = datetime.now(timezone.utc)

    login_attempt = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.ip_address == ip_address)
        .first()
    )

    if not login_attempt:
        login_attempt = LoginAttempt(
            ip_address=ip_address,
            attempts_count=1,
            last_attempt_at=now
        )

        db.add(login_attempt)
        db.commit()
        return

    login_attempt.attempts_count += 1
    login_attempt.last_attempt_at = now

    if login_attempt.attempts_count >= MAX_LOGIN_ATTEMPTS:
        login_attempt.blocked_until = now + timedelta(seconds=LOGIN_COOLDOWN_SECONDS)

    db.commit()


def reset_login_attempts(db: Session, ip_address: str) -> None:
    login_attempt = (
        db.query(LoginAttempt)
        .filter(LoginAttempt.ip_address == ip_address)
        .first()
    )

    if not login_attempt:
        return

    login_attempt.attempts_count = 0
    login_attempt.blocked_until = None
    login_attempt.last_attempt_at = datetime.now(timezone.utc)

    db.commit()