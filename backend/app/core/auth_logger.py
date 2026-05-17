import requests

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.auth_log import AuthLog


def get_geo_data(ip_address: str):
    try:
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}",
            timeout=3
        )

        data = response.json()

        return {
            "country": data.get("country"),
            "region": data.get("regionName"),
            "city": data.get("city"),
        }

    except Exception:
        return {
            "country": None,
            "region": None,
            "city": None,
        }


def create_auth_log(
    db: Session,
    request: Request,
    username_or_email: str,
    status: str,
    message: str,
):
    ip_address = request.client.host

    geo = get_geo_data(ip_address)

    auth_log = AuthLog(
        ip_address=ip_address,
        username_or_email=username_or_email,
        country=geo["country"],
        region=geo["region"],
        city=geo["city"],
        user_agent=request.headers.get("user-agent"),
        status=status,
        message=message,
    )

    db.add(auth_log)
    db.commit()