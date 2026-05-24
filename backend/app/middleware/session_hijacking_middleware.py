from typing import Dict, Optional, Tuple

from jose import JWTError, jwt
from starlette.responses import JSONResponse

from app.config import SECRET_KEY, ALGORITHM
from app.core.app_logger import get_security_logger
from app.core.session_hijacking_detector import analyze_session_activity
from app.database import SessionLocal
from app.models.user import User


security_logger = get_security_logger()


IGNORED_PATH_PREFIXES = (
    "/uploads",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
    "/auth/login",
    "/auth/register",
)


class SessionHijackingProtectionMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        if self._should_ignore_path(path):
            await self.app(scope, receive, send)
            return

        headers = self._get_headers(scope)
        authorization = headers.get("authorization")

        if not authorization:
            await self.app(scope, receive, send)
            return

        token = self._extract_bearer_token(authorization)

        if not token:
            await self.app(scope, receive, send)
            return

        payload = self._decode_token(token)

        if not payload:
            await self.app(scope, receive, send)
            return

        user_id = payload.get("sub")

        if not user_id:
            await self.app(scope, receive, send)
            return

        try:
            user_id = int(user_id)
        except ValueError:
            await self.app(scope, receive, send)
            return

        ip_address = self._get_client_ip(scope)
        user_agent = headers.get("user-agent", "unknown")
        method = scope.get("method", "-")

        db = SessionLocal()

        try:
            user = db.query(User).filter(User.id == user_id).first()

            username_or_email = None

            if user:
                username_or_email = user.email or user.username

            is_suspicious = analyze_session_activity(
                db=db,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                path=path,
                method=method,
                username_or_email=username_or_email,
            )

            if is_suspicious:
                response = JSONResponse(
                    status_code=403,
                    content={
                        "detail": "Запрос заблокирован системой защиты от угона сессии",
                        "incident_type": "Session Hijacking Attempt",
                    },
                )

                await response(scope, receive, send)
                return

        except Exception as error:
            security_logger.error(
                f"Session hijacking middleware error | "
                f"user_id={user_id} | "
                f"ip={ip_address} | "
                f"path={path} | "
                f"error={error}"
            )

        finally:
            db.close()

        await self.app(scope, receive, send)

    @staticmethod
    def _should_ignore_path(path: str) -> bool:
        return path.startswith(IGNORED_PATH_PREFIXES)

    @staticmethod
    def _get_headers(scope) -> Dict[str, str]:
        headers: Dict[str, str] = {}

        for raw_name, raw_value in scope.get("headers", []):
            name = raw_name.decode("latin-1").lower()
            value = raw_value.decode("latin-1")

            headers[name] = value

        return headers

    @staticmethod
    def _extract_bearer_token(authorization: str) -> Optional[str]:
        if not authorization.lower().startswith("bearer "):
            return None

        return authorization.split(" ", 1)[1].strip()

    @staticmethod
    def _decode_token(token: str) -> Optional[dict]:
        try:
            return jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )

        except JWTError:
            return None

    def _get_client_ip(self, scope) -> str:
        headers = self._get_headers(scope)

        forwarded_for = headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        client: Optional[Tuple[str, int]] = scope.get("client")

        if client:
            return client[0]

        return "unknown"