from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import unquote_plus

from starlette.responses import JSONResponse

from app.core.app_logger import get_security_logger
from app.core.rce_detector import detect_rce_payload
from app.database import SessionLocal
from app.models.security_incident import SecurityIncident


security_logger = get_security_logger()


RCE_DUPLICATE_COOLDOWN_SECONDS = 300

IGNORED_PATH_PREFIXES = (
    "/uploads",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
)


class RCEProtectionMiddleware:
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

        body = await self._read_body(receive)

        request_text = self._build_scan_text(
            scope=scope,
            body=body,
        )

        detected_patterns = detect_rce_payload(request_text)

        if detected_patterns:
            ip_address = self._get_client_ip(scope)
            method = scope.get("method", "-")

            self._create_rce_incident(
                ip_address=ip_address,
                method=method,
                path=path,
                detected_patterns=detected_patterns,
                request_text_preview=request_text[:500],
            )

            response = JSONResponse(
                status_code=403,
                content={
                    "detail": "Запрос заблокирован системой защиты от RCE",
                    "incident_type": "RCE Attempt",
                },
            )

            await response(scope, receive, send)
            return

        async def receive_again():
            return {
                "type": "http.request",
                "body": body,
                "more_body": False,
            }

        await self.app(scope, receive_again, send)

    @staticmethod
    def _should_ignore_path(path: str) -> bool:
        return path.startswith(IGNORED_PATH_PREFIXES)

    @staticmethod
    async def _read_body(receive) -> bytes:
        body = b""

        more_body = True

        while more_body:
            message = await receive()

            body += message.get("body", b"")

            more_body = message.get("more_body", False)

        return body

    def _build_scan_text(
        self,
        scope,
        body: bytes,
    ) -> str:
        parts: List[str] = []

        query_string = scope.get("query_string", b"")

        if query_string:
            parts.append(
                unquote_plus(
                    query_string.decode("utf-8", errors="ignore")
                )
            )

        headers = self._get_headers(scope)

        for header_name, header_value in headers.items():
            lower_name = header_name.lower()

            if lower_name in [
                "authorization",
                "cookie",
                "set-cookie",
            ]:
                continue

            parts.append(f"{header_name}: {header_value}")

        content_type = headers.get("content-type", "")

        if self._should_scan_body(content_type):
            parts.append(
                body.decode("utf-8", errors="ignore")
            )

        return "\n".join(parts)

    @staticmethod
    def _should_scan_body(content_type: str) -> bool:
        if not content_type:
            return True

        content_type = content_type.lower()

        return (
            "application/json" in content_type
            or "application/x-www-form-urlencoded" in content_type
            or "multipart/form-data" in content_type
            or "text/plain" in content_type
        )

    @staticmethod
    def _get_headers(scope) -> Dict[str, str]:
        headers: Dict[str, str] = {}

        for raw_name, raw_value in scope.get("headers", []):
            name = raw_name.decode("latin-1")
            value = raw_value.decode("latin-1")

            headers[name] = value

        return headers

    def _get_client_ip(self, scope) -> str:
        headers = self._get_headers(scope)

        forwarded_for = headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        client: Optional[Tuple[str, int]] = scope.get("client")

        if client:
            return client[0]

        return "unknown"

    def _recent_rce_incident_exists(
        self,
        db,
        ip_address: str,
    ) -> bool:
        cooldown_start = datetime.now(timezone.utc) - timedelta(
            seconds=RCE_DUPLICATE_COOLDOWN_SECONDS
        )

        incident = (
            db.query(SecurityIncident)
            .filter(
                SecurityIncident.incident_type == "RCE Attempt",
                SecurityIncident.ip_address == ip_address,
                SecurityIncident.created_at >= cooldown_start,
                SecurityIncident.status == "OPEN",
            )
            .first()
        )

        return incident is not None

    def _create_rce_incident(
        self,
        ip_address: str,
        method: str,
        path: str,
        detected_patterns: List[str],
        request_text_preview: str,
    ):
        db = SessionLocal()

        try:
            if self._recent_rce_incident_exists(
                db=db,
                ip_address=ip_address,
            ):
                security_logger.warning(
                    f"RCE attempt blocked without duplicate incident | "
                    f"ip={ip_address} | method={method} | path={path} | "
                    f"patterns={detected_patterns}"
                )

                return

            description = (
                f"Обнаружена попытка RCE / удаленного выполнения кода. "
                f"IP-адрес: {ip_address}. "
                f"Запрос: {method} {path}. "
                f"Сработавшие правила: {', '.join(detected_patterns)}. "
                f"Фрагмент запроса: {request_text_preview}"
            )

            incident = SecurityIncident(
                incident_type="RCE Attempt",
                severity="CRITICAL",
                status="OPEN",
                ip_address=ip_address,
                username_or_email=None,
                description=description,
            )

            db.add(incident)
            db.commit()
            db.refresh(incident)

            security_logger.critical(
                f"RCE ATTEMPT BLOCKED | "
                f"incident_id={incident.id} | "
                f"ip={ip_address} | "
                f"method={method} | "
                f"path={path} | "
                f"patterns={detected_patterns}"
            )

        except Exception as error:
            db.rollback()

            security_logger.error(
                f"Failed to create RCE incident | "
                f"ip={ip_address} | "
                f"method={method} | "
                f"path={path} | "
                f"error={error}"
            )

        finally:
            db.close()