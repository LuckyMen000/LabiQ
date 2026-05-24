from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Deque, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.security_incident import SecurityIncident


DOS_WINDOW_SECONDS = 60
DOS_REQUEST_THRESHOLD = 100

BOTNET_WINDOW_SECONDS = 60
BOTNET_TOTAL_REQUEST_THRESHOLD = 300
BOTNET_UNIQUE_IP_THRESHOLD = 20

INCIDENT_DUPLICATE_COOLDOWN_SECONDS = 600

IGNORED_PATH_PREFIXES = (
    "/uploads",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
)

_request_lock = Lock()

_ip_requests: Dict[str, Deque[datetime]] = defaultdict(deque)
_global_requests: Deque[Tuple[datetime, str]] = deque()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def should_ignore_path(path: str) -> bool:
    return path.startswith(IGNORED_PATH_PREFIXES)


def _cleanup_old_requests(now: datetime) -> None:
    dos_cutoff = now - timedelta(seconds=DOS_WINDOW_SECONDS)
    botnet_cutoff = now - timedelta(seconds=BOTNET_WINDOW_SECONDS)

    for ip_address in list(_ip_requests.keys()):
        request_times = _ip_requests[ip_address]

        while request_times and request_times[0] < dos_cutoff:
            request_times.popleft()

        if not request_times:
            del _ip_requests[ip_address]

    while _global_requests and _global_requests[0][0] < botnet_cutoff:
        _global_requests.popleft()


def _recent_incident_exists(
    db: Session,
    incident_type: str,
    duplicate_ip_address: Optional[str] = None,
) -> bool:
    cooldown_start = _now() - timedelta(
        seconds=INCIDENT_DUPLICATE_COOLDOWN_SECONDS
    )

    query = db.query(SecurityIncident).filter(
        SecurityIncident.incident_type == incident_type,
        SecurityIncident.created_at >= cooldown_start,
        SecurityIncident.status == "OPEN",
    )

    if duplicate_ip_address:
        query = query.filter(SecurityIncident.ip_address == duplicate_ip_address)

    return query.first() is not None


def _create_security_incident(
    db: Session,
    incident_type: str,
    severity: str,
    ip_address: Optional[str],
    description: str,
    duplicate_ip_address: Optional[str] = None,
) -> Optional[SecurityIncident]:
    if _recent_incident_exists(
        db=db,
        incident_type=incident_type,
        duplicate_ip_address=duplicate_ip_address,
    ):
        return None

    incident = SecurityIncident(
        incident_type=incident_type,
        severity=severity,
        status="OPEN",
        ip_address=ip_address,
        username_or_email=None,
        description=description,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    print(
        "\n"
        "============================================================\n"
        "[SECURITY INCIDENT CREATED]\n"
        f"Type: {incident.incident_type}\n"
        f"Severity: {incident.severity}\n"
        f"IP: {incident.ip_address or '-'}\n"
        f"Description: {incident.description}\n"
        f"Created at: {incident.created_at}\n"
        "============================================================\n",
        flush=True,
    )

    return incident


def _format_botnet_ip_preview(unique_ips: List[str]) -> str:
    preview_ips = unique_ips[:5]
    preview = ", ".join(preview_ips)

    if len(unique_ips) > 5:
        preview += f", +{len(unique_ips) - 5} IP"

    return preview[:100]


def analyze_request_activity(
    db: Session,
    ip_address: str,
    path: str,
    method: str,
) -> List[SecurityIncident]:
    if should_ignore_path(path):
        return []

    now = _now()

    created_incidents: List[SecurityIncident] = []

    with _request_lock:
        _ip_requests[ip_address].append(now)
        _global_requests.append((now, ip_address))

        _cleanup_old_requests(now)

        ip_request_count = len(_ip_requests[ip_address])

        global_request_count = len(_global_requests)
        unique_ips = sorted({ip for _, ip in _global_requests})
        unique_ip_count = len(unique_ips)

    if ip_request_count >= DOS_REQUEST_THRESHOLD:
        incident = _create_security_incident(
            db=db,
            incident_type="DoS",
            severity="HIGH",
            ip_address=ip_address,
            duplicate_ip_address=ip_address,
            description=(
                f"Обнаружена подозрительная активность типа DoS. "
                f"IP-адрес {ip_address} выполнил {ip_request_count} запросов "
                f"за последние {DOS_WINDOW_SECONDS} секунд. "
                f"Последний запрос: {method} {path}."
            ),
        )

        if incident:
            created_incidents.append(incident)

    if (
        global_request_count >= BOTNET_TOTAL_REQUEST_THRESHOLD
        and unique_ip_count >= BOTNET_UNIQUE_IP_THRESHOLD
    ):
        botnet_ip_preview = _format_botnet_ip_preview(unique_ips)

        incident = _create_security_incident(
            db=db,
            incident_type="Botnet",
            severity="CRITICAL",
            ip_address=botnet_ip_preview,
            duplicate_ip_address=None,
            description=(
                f"Обнаружена подозрительная активность типа Botnet. "
                f"За последние {BOTNET_WINDOW_SECONDS} секунд поступило "
                f"{global_request_count} запросов с {unique_ip_count} разных IP-адресов. "
                f"IP-адреса источников: {', '.join(unique_ips)}. "
                f"Последний запрос: {method} {path}."
            ),
        )

        if incident:
            created_incidents.append(incident)

    return created_incidents