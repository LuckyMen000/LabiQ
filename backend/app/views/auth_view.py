from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.auth_controller import AuthController
from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)


@router.post("/register", response_model=AuthResponse)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    return AuthController.register_user(payload, db)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    return AuthController.login_user(payload, db)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user