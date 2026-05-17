from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(Integer, primary_key=True, index=True)

    incident_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="medium")

    ip_address = Column(String(100), nullable=True)
    username_or_email = Column(String(255), nullable=True)

    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)