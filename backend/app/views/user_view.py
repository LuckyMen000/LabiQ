from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.current_user import get_current_user
from app.controllers.user_controller import (
    delete_user_avatar,
    update_user_password,
    update_user_profile,
    upload_user_avatar,
)
from app.models.user import User
from app.schemas.user_schema import (
    UserPasswordUpdate,
    UserProfileUpdate,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user_profile(
        db=db,
        current_user=current_user,
        payload=payload,
    )


@router.patch("/me/password")
def change_password(
    payload: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user_password(
        db=db,
        current_user=current_user,
        payload=payload,
    )


@router.post("/me/avatar", response_model=UserResponse)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upload_user_avatar(
        db=db,
        user=current_user,
        file=file,
    )


@router.put("/me/avatar", response_model=UserResponse)
def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upload_user_avatar(
        db=db,
        user=current_user,
        file=file,
    )


@router.delete("/me/avatar", response_model=UserResponse)
def remove_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_user_avatar(
        db=db,
        user=current_user,
    )