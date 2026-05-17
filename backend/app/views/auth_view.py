from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.controllers.auth_controller import AuthController
from app.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/register", response_model=AuthResponse)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    return AuthController.register_user(payload=payload, db=db)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    return AuthController.login_user(
        payload=payload,
        db=db,
        request=request
    )