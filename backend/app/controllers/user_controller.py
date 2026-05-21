import os
import shutil
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserPasswordUpdate, UserProfileUpdate
from app.core.security import hash_password, verify_password


AVATAR_DIR = "uploads/avatars"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024


def update_user_profile(
    db: Session,
    current_user: User,
    payload: UserProfileUpdate,
):
    existing_email = (
        db.query(User)
        .filter(
            User.email == payload.email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует",
        )

    existing_username = (
        db.query(User)
        .filter(
            User.username == payload.username,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким логином уже существует",
        )

    current_user.full_name = payload.full_name.strip()
    current_user.email = payload.email.strip()
    current_user.username = payload.username.strip()

    db.commit()
    db.refresh(current_user)

    return current_user


def update_user_password(
    db: Session,
    current_user: User,
    payload: UserPasswordUpdate,
):
    if not verify_password(
        payload.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Текущий пароль указан неверно",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="Новый пароль не должен совпадать с текущим",
        )

    current_user.hashed_password = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Пароль успешно обновлен",
    }


def _get_file_extension(filename: str) -> str:
    if "." not in filename:
        raise HTTPException(
            status_code=400,
            detail="Файл должен иметь расширение",
        )

    extension = filename.rsplit(".", 1)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Разрешены только изображения JPG, JPEG, PNG или WEBP",
        )

    return extension


def _delete_old_avatar(avatar_url: str | None):
    if not avatar_url:
        return

    file_path = avatar_url.lstrip("/")

    if os.path.exists(file_path):
        os.remove(file_path)


def upload_user_avatar(
    db: Session,
    user: User,
    file: UploadFile,
):
    extension = _get_file_extension(file.filename or "")

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Размер аватарки не должен превышать 2 MB",
        )

    os.makedirs(AVATAR_DIR, exist_ok=True)

    _delete_old_avatar(user.avatar_url)

    filename = f"user_{user.id}_{uuid4().hex}.{extension}"
    file_path = os.path.join(AVATAR_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.avatar_url = f"/uploads/avatars/{filename}"

    db.commit()
    db.refresh(user)

    return user


def delete_user_avatar(
    db: Session,
    user: User,
):
    if not user.avatar_url:
        raise HTTPException(
            status_code=404,
            detail="У пользователя нет аватарки",
        )

    _delete_old_avatar(user.avatar_url)

    user.avatar_url = None

    db.commit()
    db.refresh(user)

    return user