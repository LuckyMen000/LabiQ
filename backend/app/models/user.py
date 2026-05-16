from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)

    hashed_password = Column(String(255), nullable=False)

    role = Column(String(100), default="Лаборант", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())