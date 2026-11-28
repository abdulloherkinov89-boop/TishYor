from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.auth import (
    create_access_token,
    extract_uz_phone_digits,
    normalize_uz_phone,
    phone_lookup_expression,
)
from database.db import get_db
from models.models import Clinic, User
from schemas.schemas import TokenResponse, UserCreate, UserOut


router = APIRouter(prefix="/auth", tags=["Ro'yxatdan o'tish"])


def normalize_telefon(telefon: str) -> str:
    return normalize_uz_phone(telefon)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Foydalanuvchini ro'yxatdan o'tkazish",
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yangi bemorni ro'yxatdan o'tkazadi va JWT qaytaradi."""
    ism = user_data.ism.strip()
    familiya = user_data.familiya.strip()
    if not ism or not familiya:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ism va familiya kiritilishi shart",
        )

    try:
        telefon = normalize_uz_phone(user_data.telefon)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    digits = extract_uz_phone_digits(telefon)
    existing_user = (
        db.query(User)
        .filter(phone_lookup_expression(User.telefon) == digits)
        .first()
    )
    existing_clinic = (
        db.query(Clinic)
        .filter(phone_lookup_expression(Clinic.telefon) == digits)
        .first()
    )
    if existing_user or existing_clinic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan",
        )

    user = User(
        ism=ism,
        familiya=familiya,
        telefon=telefon,
        role="patient",
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu telefon raqam bilan allaqachon ro'yxatdan o'tilgan",
        )

    token = create_access_token(user.id, user.telefon, role="patient")
    return TokenResponse(access_token=token, user=user)


@router.get(
    "/users",
    response_model=list[UserOut],
    summary="Ro'yxatdan o'tgan foydalanuvchilarni olish",
)
def get_registered_users(db: Session = Depends(get_db)):
    """Ro'yxatdan o'tgan foydalanuvchilar ro'yxatini qaytaradi."""
    return db.query(User).order_by(User.id.desc()).all()