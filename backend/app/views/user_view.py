from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.current_user import get_current_user
from app.controllers.user_controller import upload_user_avatar, delete_user_avatar
from app.models.user import User
from app.schemas.user_schema import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upload_user_avatar(db=db, user=current_user, file=file)


@router.put("/me/avatar", response_model=UserResponse)
def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upload_user_avatar(db=db, user=current_user, file=file)


@router.delete("/me/avatar", response_model=UserResponse)
def remove_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_user_avatar(db=db, user=current_user)