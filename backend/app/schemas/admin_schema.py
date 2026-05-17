from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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


class AdminLogResponse(BaseModel):
    id: int
    ip_address: Optional[str] = None
    username_or_email: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    message: Optional[str] = None
    created_at: datetime
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    users_total: int
    users_active: int
    users_inactive: int
    admins_total: int
    auth_logs_total: int
    successful_logins: int
    failed_logins: int