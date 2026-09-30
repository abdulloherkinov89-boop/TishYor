import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.auth import create_access_token
from database.db import get_db
from models.models import Clinic, User
from schemas.schemas import AuthResponse, LoginRequest

router = APIRouter(prefix="/auth", tags=["Kirish"])


def normalize_telefon(telefon: str) -> str:
    return re.sub(r"\s+", "", telefon)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Foydalanuvchini tizimga kiritish",
)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    telefon = normalize_telefon(login_data.telefon)

    clinic = (
        db.query(Clinic)
        .filter(func.replace(Clinic.telefon, " ", "") == telefon)
        .first()
    )
    if clinic is not None:
        token = create_access_token(clinic.id, telefon, role="clinic")
        return AuthResponse(
            access_token=token,
            user={"id": clinic.id, "name": clinic.name, "telefon": telefon, "role": "clinic"},
        )

    user = (
        db.query(User)
        .filter(func.replace(User.telefon, " ", "") == telefon)
        .first()
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu telefon raqam bilan foydalanuvchi topilmadi",
        )

    token = create_access_token(user.id, user.telefon, role=user.role)
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "ism": user.ism,
            "familiya": user.familiya,
            "telefon": user.telefon,
            "role": user.role,
        },
    )