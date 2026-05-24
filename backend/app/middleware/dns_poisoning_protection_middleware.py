from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from starlette.responses import JSONResponse

from app.core.app_logger import get_security_logger
from app.database import SessionLocal
from app.models.security_incident import SecurityIncident


security_logger = get_security_logger()


DNS_DUPLICATE_COOLDOWN_SECONDS = 300


ALLOWED_HOSTS = {
    "localhost",
    "localhost:8000",
    "127.0.0.1",
    "127.0.0.1:8000",
    "0.0.0.0",
    "0.0.0.0:8000",
}


IGNORED_PATH_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
)


class DNSPoisoningProtectionMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "-")
        path = scope.get("path", "")

        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        if self._should_ignore_path(path):
            await self.app(scope, receive, send)
            return

        headers = self._get_headers(scope)

        host = headers.get("host", "")
        forwarded_host = headers.get("x-forwarded-host", "")
        origin = headers.get("origin", "")
        referer = headers.get("referer", "")

        suspicious_reasons = self._detect_suspicious_dns_context(
            host=host,
            forwarded_host=forwarded_host,
            origin=origin,
            referer=referer,
        )

        if suspicious_reasons:
            ip_address = self._get_client_ip(scope)

            self._create_dns_poisoning_incident(
                ip_address=ip_address,
                method=method,
                path=path,
                host=host,
                forwarded_host=forwarded_host,
                origin=origin,
                referer=referer,
                reasons=suspicious_reasons,
            )

            response = JSONResponse(
                status_code=403,
                content={
                    "detail": "Запрос заблокирован системой защиты от DNS Poisoning / Host Header Attack",
                    "incident_type": "DNS Poisoning Attempt",
                },
            )

            await response(scope, receive, send)
            return

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

    def _detect_suspicious_dns_context(
        self,
        host: str,
        forwarded_host: str,
        origin: str,
        referer: str,
    ) -> List[str]:
        reasons: List[str] = []

        normalized_host = self._normalize_host(host)
        normalized_forwarded_host = self._normalize_host(forwarded_host)

        if not normalized_host:
            reasons.append("Missing Host header")

        if normalized_host and normalized_host not in ALLOWED_HOSTS:
            reasons.append(f"Unexpected Host header: {host}")

        if normalized_forwarded_host and normalized_forwarded_host not in ALLOWED_HOSTS:
            reasons.append(f"Unexpected X-Forwarded-Host header: {forwarded_host}")

        if origin:
            origin_host = self._extract_host_from_url(origin)

            if origin_host and origin_host not in ALLOWED_HOSTS and "localhost:3000" not in origin_host:
                reasons.append(f"Unexpected Origin header: {origin}")

        if referer:
            referer_host = self._extract_host_from_url(referer)

            if referer_host and referer_host not in ALLOWED_HOSTS and "localhost:3000" not in referer_host:
                reasons.append(f"Unexpected Referer header: {referer}")

        return reasons

    @staticmethod
    def _normalize_host(host: str) -> str:
        if not host:
            return ""

        host = host.strip().lower()

        if "@" in host:
            return host

        return host

    @staticmethod
    def _extract_host_from_url(value: str) -> str:
        if not value:
            return ""

        value = value.strip().lower()

        value = value.replace("http://", "")
        value = value.replace("https://", "")

        return value.split("/")[0]

    def _get_client_ip(self, scope) -> str:
        headers = self._get_headers(scope)

        forwarded_for = headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        client: Optional[Tuple[str, int]] = scope.get("client")

        if client:
            return client[0]

        return "unknown"

    def _recent_dns_poisoning_incident_exists(
        self,
        db,
        ip_address: str,
        host: str,
    ) -> bool:
        cooldown_start = datetime.now(timezone.utc) - timedelta(
            seconds=DNS_DUPLICATE_COOLDOWN_SECONDS
        )

        incident = (
            db.query(SecurityIncident)
            .filter(
                SecurityIncident.incident_type == "DNS Poisoning Attempt",
                SecurityIncident.ip_address == ip_address,
                SecurityIncident.created_at >= cooldown_start,
                SecurityIncident.status == "OPEN",
                SecurityIncident.description.ilike(f"%{host}%"),
            )
            .first()
        )

        return incident is not None

    def _create_dns_poisoning_incident(
        self,
        ip_address: str,
        method: str,
        path: str,
        host: str,
        forwarded_host: str,
        origin: str,
        referer: str,
        reasons: List[str],
    ):
        db = SessionLocal()

        try:
            if self._recent_dns_poisoning_incident_exists(
                db=db,
                ip_address=ip_address,
                host=host,
            ):
                security_logger.warning(
                    f"DNS POISONING blocked without duplicate incident | "
                    f"ip={ip_address} | "
                    f"method={method} | "
                    f"path={path} | "
                    f"host={host} | "
                    f"reasons={reasons}"
                )

                return

            description = (
                f"Обнаружена возможная попытка DNS Poisoning / Host Header Attack. "
                f"IP-адрес: {ip_address}. "
                f"Запрос: {method} {path}. "
                f"Host: {host or '-'}. "
                f"X-Forwarded-Host: {forwarded_host or '-'}. "
                f"Origin: {origin or '-'}. "
                f"Referer: {referer or '-'}. "
                f"Причины блокировки: {', '.join(reasons)}."
            )

            incident = SecurityIncident(
                incident_type="DNS Poisoning Attempt",
                severity="HIGH",
                status="OPEN",
                ip_address=ip_address,
                username_or_email=None,
                description=description,
            )

            db.add(incident)
            db.commit()
            db.refresh(incident)

            security_logger.critical(
                f"DNS POISONING ATTEMPT BLOCKED | "
                f"incident_id={incident.id} | "
                f"ip={ip_address} | "
                f"method={method} | "
                f"path={path} | "
                f"host={host} | "
                f"forwarded_host={forwarded_host} | "
                f"reasons={reasons}"
            )

        except Exception as error:
            db.rollback()

            security_logger.error(
                f"Failed to create DNS poisoning incident | "
                f"ip={ip_address} | "
                f"method={method} | "
                f"path={path} | "
                f"host={host} | "
                f"error={error}"
            )

        finally:
            db.close()