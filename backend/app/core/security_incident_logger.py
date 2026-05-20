import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.security_incident import SecurityIncident


logger = logging.getLogger(__name__)


def create_security_incident(
    db: Session,
    incident_type: str,
    severity: str,
    ip_address: Optional[str] = None,
    username_or_email: Optional[str] = None,
    description: Optional[str] = None,
    user_id: Optional[int] = None,
    status: str = "OPEN",
) -> SecurityIncident:
    incident = SecurityIncident(
        incident_type=incident_type,
        severity=severity,
        ip_address=ip_address,
        username_or_email=username_or_email,
        description=description,
        user_id=user_id,
        status=status,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    logger.warning(
        "BRUTE FORCE / SECURITY INCIDENT DETECTED | type=%s | severity=%s | ip=%s | login=%s | user_id=%s",
        incident_type,
        severity,
        ip_address,
        username_or_email,
        user_id,
    )

    return incident