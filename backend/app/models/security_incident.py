from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    incident_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    severity = Column(
        String(50),
        nullable=False,
        default="MEDIUM",
    )

    ip_address = Column(
        String(100),
        nullable=True,
        index=True,
    )

    username_or_email = Column(
        String(255),
        nullable=True,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        default="OPEN",
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="security_incidents",
        passive_deletes=True,
    )