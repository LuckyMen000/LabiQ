from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.core.app_logger import get_app_logger

router = APIRouter(
    prefix="/frontend-logs",
    tags=["Frontend Logs"],
)

logger = get_app_logger()


class FrontendLogRequest(BaseModel):
    level: str = "error"
    message: str
    details: Optional[Any] = None
    createdAt: Optional[str] = None


@router.post("")
async def create_frontend_log(payload: FrontendLogRequest, request: Request):
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    logger.warning(
        "FrontendLog | "
        f"level={payload.level} | "
        f"message={payload.message} | "
        f"ip={ip_address} | "
        f"user_agent={user_agent} | "
        f"created_at={payload.createdAt or datetime.utcnow().isoformat()} | "
        f"details={payload.details}"
    )

    return {
        "status": "ok",
        "message": "Frontend log saved",
    }