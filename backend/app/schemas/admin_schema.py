from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.roles import ALL_ROLES, LAB_TECHNICIAN


class AuthLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    username_or_email: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UnifiedLogResponse(BaseModel):
    id: int
    source_id: int
    log_type: str
    action: str
    actor: Optional[str] = None
    target: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    username: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    role: str = Field(default=LAB_TECHNICIAN, max_length=100)
    is_active: bool = True

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in ALL_ROLES:
            raise ValueError("Недопустимая роль пользователя")

        return value


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=100)
    password: Optional[str] = Field(default=None, min_length=6)
    role: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        if value not in ALL_ROLES:
            raise ValueError("Недопустимая роль пользователя")

        return value


class AdminStatsResponse(BaseModel):
    users_count: int
    active_users_count: int
    inactive_users_count: int
    auth_logs_count: int
    success_login_count: int
    failed_login_count: int
    forbidden_login_count: int
    audit_logs_count: int
    security_incidents_count: int


class IpBlockRequest(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=100)
    block_seconds: int = Field(default=3600, ge=60, le=86400)
    reason: Optional[str] = Field(default=None, max_length=500)


class IpUnblockRequest(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=100)
    reason: Optional[str] = Field(default=None, max_length=500)