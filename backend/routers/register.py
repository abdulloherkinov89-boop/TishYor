import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.auth import create_access_token
from database.db import get_db
from models.models import Clinic, User
from schemas.schemas import TokenResponse, UserCreate, UserOut


router = APIRouter(prefix="/auth", tags=["Ro'yxatdan o'tish"])


def normalize_telefon(telefon: str) -> str:
    digits = re.sub(r"\D", "", telefon)
    if len(digits) == 9:
        digits = "998" + digits
    return digits


def phone_lookup_expression(column):
    expression = func.replace(column, " ", "")
    for separator in ("+", "(", ")", "-", "."):
        expression = func.replace(expression, separator, "")
    return expression


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Foydalanuvchini ro'yxatdan o'tkazish",
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yangi bemorni ro'yxatdan o'tkazadi va JWT qaytaradi."""
    telefon = normalize_telefon(user_data.telefon)
    existing_user = (
        db.query(User)
        .filter(phone_lookup_expression(User.telefon) == telefon)
        .first()
    )
    existing_clinic = (
        db.query(Clinic)
        .filter(phone_lookup_expression(Clinic.telefon) == telefon)
        .first()
    )
    if existing_user or existing_clinic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu raqam bilan allaqachon ro'yxatdan o'tilgan",
        )

    user = User(
        ism=user_data.ism,
        familiya=user_data.familiya,
        telefon=telefon,
        role="patient",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.telefon)
    return TokenResponse(access_token=token, user=user)


@router.get(
    "/users",
    response_model=list[UserOut],
    summary="Ro'yxatdan o'tgan foydalanuvchilarni olish",
)
def get_registered_users(db: Session = Depends(get_db)):
    """Ro'yxatdan o'tgan foydalanuvchilar ro'yxatini qaytaradi."""
    return db.query(User).order_by(User.id.desc()).all()