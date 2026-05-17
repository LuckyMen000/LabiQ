from sqlalchemy.orm import Session

from app.models.security_incident import SecurityIncident


def create_security_incident(
    db: Session,
    incident_type: str,
    severity: str,
    ip_address: str | None = None,
    username_or_email: str | None = None,
    description: str | None = None,
):
    incident = SecurityIncident(
        incident_type=incident_type,
        severity=severity,
        ip_address=ip_address,
        username_or_email=username_or_email,
        description=description,
        status="open",
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    return incident