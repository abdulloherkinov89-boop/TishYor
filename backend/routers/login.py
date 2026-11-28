from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from auth.auth import (
    create_access_token,
    decode_access_token,
    extract_uz_phone_digits,
    normalize_uz_phone,
    phone_lookup_expression,
)
from database.db import get_db
from models.models import Clinic, User
from schemas.schemas import AuthResponse, LoginRequest

router = APIRouter(prefix="/auth", tags=["Kirish"])
bearer_scheme = HTTPBearer(auto_error=False)


def serialize_clinic_user(clinic: Clinic) -> dict:
    return {
        "id": clinic.id,
        "name": clinic.name,
        "telefon": clinic.telefon,
        "address": clinic.address,
        "status": clinic.status.value if hasattr(clinic.status, "value") else clinic.status,
        "patients_served": clinic.patients_served,
        "rating": clinic.rating,
        "logo_url": clinic.logo_url,
        "created_at": clinic.created_at,
        "role": "clinic",
    }


def serialize_patient_user(user: User) -> dict:
    return {
        "id": user.id,
        "ism": user.ism,
        "familiya": user.familiya,
        "telefon": user.telefon,
        "role": "patient",
        "created_at": user.created_at,
    }


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Foydalanuvchini tizimga kiritish",
)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        canonical_telefon = normalize_uz_phone(login_data.telefon)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    digits = extract_uz_phone_digits(canonical_telefon)
    requested_role = login_data.role

    clinic = None
    user = None
    if requested_role in (None, "clinic"):
        clinic = (
            db.query(Clinic)
            .filter(phone_lookup_expression(Clinic.telefon) == digits)
            .first()
        )
    if requested_role in (None, "patient"):
        user = (
            db.query(User)
            .filter(phone_lookup_expression(User.telefon) == digits)
            .first()
        )

    if requested_role is None:
        if clinic is not None and user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu telefon raqam bir nechta hisobda bor. Iltimos, hisob turini tanlang.",
            )
        if clinic is not None:
            requested_role = "clinic"
        elif user is not None and user.role == "patient":
            requested_role = "patient"
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu telefon raqam bilan hisob topilmadi",
            )

    if requested_role == "clinic":
        if clinic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu telefon raqam bilan klinika topilmadi",
            )
        token = create_access_token(clinic.id, clinic.telefon, role="clinic")
        return AuthResponse(
            access_token=token,
            user=serialize_clinic_user(clinic),
        )

    if user is None or user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu telefon raqam bilan bemor topilmadi",
        )

    token = create_access_token(user.id, user.telefon, role="patient")
    return AuthResponse(
        access_token=token,
        user=serialize_patient_user(user),
    )


@router.get("/me", summary="Joriy foydalanuvchi yoki klinika ma'lumotlari")
def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Yaroqli Bearer token talab qilinadi",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise unauthorized

    role = payload.get("role")
    try:
        subject_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized

    if role == "clinic":
        clinic = db.query(Clinic).filter(Clinic.id == subject_id).first()
        if clinic is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Klinika topilmadi")
        return serialize_clinic_user(clinic)

    if role == "patient":
        user = db.query(User).filter(User.id == subject_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
        return serialize_patient_user(user)

    raise unauthorized