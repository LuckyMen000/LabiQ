from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


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
    role: str = Field(default="Лаборант", max_length=100)
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=100)
    password: Optional[str] = Field(default=None, min_length=6)
    role: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None


class AdminStatsResponse(BaseModel):
    users_count: int
    active_users_count: int
    inactive_users_count: int
    auth_logs_count: int
    success_login_count: int
    failed_login_count: int
    forbidden_login_count: int