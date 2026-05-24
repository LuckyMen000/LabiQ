from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.database import SessionLocal
from app.core.security_incident_detector import analyze_request_activity


class SecurityMonitorMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:
        response = await call_next(request)

        db = SessionLocal()

        try:
            ip_address = self._get_client_ip(request)

            analyze_request_activity(
                db=db,
                ip_address=ip_address,
                path=request.url.path,
                method=request.method,
            )

        except Exception as error:
            print(f"[SecurityMonitorMiddleware] Error: {error}")

        finally:
            db.close()

        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if request.client:
            return request.client.host

        return "unknown"