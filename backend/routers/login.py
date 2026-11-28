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
    "/login",
    response_model=AuthResponse,
    summary="Foydalanuvchini tizimga kiritish",
)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    telefon = normalize_telefon(login_data.telefon)
    requested_role = login_data.role

    clinic = None
    user = None
    if requested_role in (None, "clinic"):
        clinic = (
            db.query(Clinic)
            .filter(phone_lookup_expression(Clinic.telefon) == telefon)
            .first()
        )
    if requested_role in (None, "patient"):
        user = (
            db.query(User)
            .filter(phone_lookup_expression(User.telefon) == telefon)
            .first()
        )

    if requested_role is None:
        if clinic is not None and user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu telefon raqam bir nechta hisobda bor. Hisob turini aniqlash uchun qo'llab-quvvatlash xizmatiga murojaat qiling.",
            )
        if clinic is not None:
            requested_role = "clinic"
        elif user is not None and user.role == "patient":
            requested_role = "patient"

    if requested_role == "clinic":
        if clinic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu telefon raqam bilan klinika topilmadi",
            )
        token = create_access_token(clinic.id, telefon, role="clinic")
        return AuthResponse(
            access_token=token,
            user={
                "id": clinic.id,
                "name": clinic.name,
                "telefon": clinic.telefon,
                "address": clinic.address,
                "status": clinic.status,
                "patients_served": clinic.patients_served,
                "rating": clinic.rating,
                "logo_url": clinic.logo_url,
                "role": "clinic",
            },
        )

    if user is None or user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu telefon raqam bilan bemor topilmadi",
        )

    token = create_access_token(user.id, user.telefon, role="patient")
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "ism": user.ism,
            "familiya": user.familiya,
            "telefon": user.telefon,
            "role": "patient",
            "created_at": user.created_at,
        },
    )