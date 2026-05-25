from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.security_incident_catalog_schema import (
    SecurityIncidentCatalogItemSchema,
)


router = APIRouter(
    prefix="/security/incidents",
    tags=["Security Incident Catalog"],
)


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["Администратор", "admin", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра каталога ИИБ",
        )

    return current_user


@router.get(
    "/catalog",
    response_model=list[SecurityIncidentCatalogItemSchema],
    summary="Каталог фиксируемых инцидентов информационной безопасности",
    description=(
        "Возвращает справочник инцидентов информационной безопасности, "
        "которые автоматически фиксируются системой LabIQ. "
        "Endpoint нужен для документации, самопроверки и описания логики ИБ в Swagger."
    ),
)
def get_security_incident_catalog(
    current_user: User = Depends(require_admin),
):
    return [
        {
            "incident_type": "Brute Force attack",
            "severity": "HIGH",
            "description": "Попытка подбора логина или пароля через многократные неуспешные входы.",
            "trigger_condition": "Создается при превышении лимита неудачных попыток входа с одного IP-адреса.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "IP-адрес, с которого выполнялись попытки входа.",
                },
                {
                    "field": "username_or_email",
                    "description": "Логин или email, который использовался при попытке входа.",
                },
                {
                    "field": "description",
                    "description": "Описание причины создания инцидента.",
                },
                {
                    "field": "created_at",
                    "description": "Дата и время фиксации инцидента.",
                },
            ],
            "storage": "security_incidents, auth_logs, security.log",
        },
        {
            "incident_type": "DoS",
            "severity": "HIGH",
            "description": "Подозрение на отказ в обслуживании через большое количество запросов с одного IP-адреса.",
            "trigger_condition": "Создается при превышении порога запросов с одного IP за короткий промежуток времени.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "IP-адрес источника большого количества запросов.",
                },
                {
                    "field": "description",
                    "description": "Количество запросов, временное окно и последний endpoint.",
                },
                {
                    "field": "incident_type",
                    "description": "Тип инцидента: DoS.",
                },
                {
                    "field": "severity",
                    "description": "Уровень критичности: HIGH.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
        {
            "incident_type": "Botnet",
            "severity": "CRITICAL",
            "description": "Подозрение на распределенную атаку с большого количества разных IP-адресов.",
            "trigger_condition": "Создается при большом количестве запросов с множества уникальных IP-адресов за короткий период.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "Список или краткий preview IP-адресов источников.",
                },
                {
                    "field": "description",
                    "description": "Количество запросов, количество уникальных IP и список источников.",
                },
                {
                    "field": "incident_type",
                    "description": "Тип инцидента: Botnet.",
                },
                {
                    "field": "severity",
                    "description": "Уровень критичности: CRITICAL.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
        {
            "incident_type": "RCE Attempt",
            "severity": "CRITICAL",
            "description": "Попытка удаленного выполнения кода через query params, body или подозрительные payload.",
            "trigger_condition": "Создается при обнаружении RCE-сигнатур: command chaining, shell execution, eval/exec, reverse shell patterns.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "IP-адрес источника подозрительного запроса.",
                },
                {
                    "field": "description",
                    "description": "Метод, endpoint, сработавшие правила и фрагмент запроса.",
                },
                {
                    "field": "incident_type",
                    "description": "Тип инцидента: RCE Attempt.",
                },
                {
                    "field": "severity",
                    "description": "Уровень критичности: CRITICAL.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
        {
            "incident_type": "Session Hijacking Attempt",
            "severity": "CRITICAL",
            "description": "Подозрение на угон пользовательской сессии.",
            "trigger_condition": "Создается при подозрительном использовании одного токена с изменением IP/User-Agent.",
            "collected_data": [
                {
                    "field": "user_id",
                    "description": "ID пользователя, чья сессия могла быть скомпрометирована.",
                },
                {
                    "field": "ip_address",
                    "description": "Новый IP-адрес, с которого был использован токен.",
                },
                {
                    "field": "username_or_email",
                    "description": "Email или username пользователя.",
                },
                {
                    "field": "description",
                    "description": "Старый IP, новый IP, старый User-Agent, новый User-Agent и endpoint.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
        {
            "incident_type": "SQL Injection Attempt",
            "severity": "CRITICAL",
            "description": "Попытка SQL-инъекции через query params или body запроса.",
            "trigger_condition": "Создается при обнаружении SQLi-паттернов: UNION SELECT, OR 1=1, DROP TABLE, SELECT FROM, information_schema и других.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "IP-адрес источника SQL Injection payload.",
                },
                {
                    "field": "description",
                    "description": "Метод, endpoint, сработавшие правила и фрагмент запроса.",
                },
                {
                    "field": "incident_type",
                    "description": "Тип инцидента: SQL Injection Attempt.",
                },
                {
                    "field": "severity",
                    "description": "Уровень критичности: CRITICAL.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
        {
            "incident_type": "DNS Poisoning Attempt",
            "severity": "HIGH",
            "description": "Подозрение на DNS Poisoning, DNS rebinding или Host Header Attack.",
            "trigger_condition": "Создается при неожиданном Host, X-Forwarded-Host, Origin или Referer.",
            "collected_data": [
                {
                    "field": "ip_address",
                    "description": "IP-адрес источника подозрительного запроса.",
                },
                {
                    "field": "description",
                    "description": "Host, X-Forwarded-Host, Origin, Referer и причины блокировки.",
                },
                {
                    "field": "incident_type",
                    "description": "Тип инцидента: DNS Poisoning Attempt.",
                },
                {
                    "field": "severity",
                    "description": "Уровень критичности: HIGH.",
                },
            ],
            "storage": "security_incidents, security.log",
        },
    ]