from typing import List

from pydantic import BaseModel, Field


class SecurityIncidentFieldSchema(BaseModel):
    field: str = Field(..., description="Название поля")
    description: str = Field(..., description="Что хранится в поле")


class SecurityIncidentCatalogItemSchema(BaseModel):
    incident_type: str = Field(..., description="Тип инцидента информационной безопасности")
    severity: str = Field(..., description="Уровень критичности")
    description: str = Field(..., description="Описание инцидента")
    trigger_condition: str = Field(..., description="Условие, при котором создается инцидент")
    collected_data: List[SecurityIncidentFieldSchema] = Field(
        ...,
        description="Какие данные фиксируются по инциденту"
    )
    storage: str = Field(..., description="Где хранится информация об инциденте")