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

    if login_data.role in (None, "clinic"):
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

    if login_data.role == "clinic":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu telefon raqam bilan klinika topilmadi",
        )

    user = (
        db.query(User)
        .filter(func.replace(User.telefon, " ", "") == telefon)
        .first()
    )
    if user is None or (login_data.role == "patient" and user.role != "patient"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu telefon raqam bilan bemor topilmadi",
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
            "created_at": user.created_at,
        },
    )