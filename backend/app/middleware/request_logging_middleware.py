import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.app_logger import get_app_logger


app_logger = get_app_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:
        start_time = time.time()

        response = await call_next(request)

        process_time = round((time.time() - start_time) * 1000, 2)

        ip_address = self._get_client_ip(request)

        app_logger.info(
            f"HTTP {request.method} {request.url.path} | "
            f"status={response.status_code} | "
            f"ip={ip_address} | "
            f"time={process_time}ms"
        )

        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if request.client:
            return request.client.host

        return "unknown"