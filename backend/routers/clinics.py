import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.auth import create_access_token, decode_access_token
from database.db import get_db
import models.models as models
import schemas.schemas as schemas

router = APIRouter(prefix="/clinics", tags=["Klinikalar"])
bearer_scheme = HTTPBearer(auto_error=False)
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
LOGOS_DIR = UPLOADS_DIR / "logos"
MAX_LOGO_SIZE = 5 * 1024 * 1024
PHONE_PATTERN = re.compile(r"^\+998\d{9}$")
IMAGE_TYPES = {
    "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/gif": (".gif", lambda data: data.startswith((b"GIF87a", b"GIF89a"))),
    "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    "image/bmp": (".bmp", lambda data: data.startswith(b"BM")),
}


def normalize_telefon(telefon: str) -> str:
    return re.sub(r"\s+", "", telefon)


@router.post(
    "/register",
    response_model=schemas.ClinicRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Klinikani ro'yxatdan o'tkazish",
)
def register_clinic(data: schemas.ClinicRegister, db: Session = Depends(get_db)):
    missing_fields = {
        field: "Ushbu maydonni to'ldirish shart"
        for field, value in (("name", data.name), ("address", data.address))
        if not value.strip()
    }
    if missing_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=missing_fields)

    telefon = normalize_telefon(data.telefon)
    if not PHONE_PATTERN.fullmatch(telefon):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"telefon": "Telefon +998XXXXXXXXX formatida bo'lishi kerak"},
        )

    existing_clinic = (
        db.query(models.Clinic)
        .filter(func.replace(models.Clinic.telefon, " ", "") == telefon)
        .first()
    )
    if existing_clinic is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu telefon raqam bilan klinika allaqachon ro'yxatdan o'tgan",
        )

    # Avoid ambiguous phone-based login between patient and clinic accounts.
    existing_user = (
        db.query(models.User)
        .filter(func.replace(models.User.telefon, " ", "") == telefon)
        .first()
    )
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu telefon raqam boshqa hisobda ishlatilmoqda",
        )

    clinic = models.Clinic(
        name=data.name.strip(),
        telefon=telefon,
        address=data.address.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        patients_served=data.patients_served,
        license_number=(data.license_number.strip() or None) if data.license_number else None,
        description=data.description,
        logo_url=data.logo_url,
        status=models.ClinicStatus.approved,
    )
    db.add(clinic)
    try:
        db.commit()
        db.refresh(clinic)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu telefon raqam bilan klinika allaqachon ro'yxatdan o'tgan",
        )

    token = create_access_token(clinic.id, clinic.telefon, role="clinic")
    return schemas.ClinicRegisterResponse(
        clinic=schemas.ClinicCreated(id=clinic.id, name=clinic.name, status=clinic.status),
        access_token=token,
    )


@router.post("/upload-logo", summary="Klinika logotipini yuklash")
async def upload_logo(request: Request, file: UploadFile = File(...)):
    image_type = IMAGE_TYPES.get(file.content_type or "")
    if image_type is None:
        raise HTTPException(status_code=400, detail="Faqat rasm fayllarini yuklash mumkin")

    content = await file.read(MAX_LOGO_SIZE + 1)
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(status_code=413, detail="Rasm hajmi 5 MB dan oshmasligi kerak")
    if not image_type[1](content):
        raise HTTPException(status_code=400, detail="Yuklangan fayl haqiqiy rasm emas")

    LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{image_type[0]}"
    (LOGOS_DIR / filename).write_bytes(content)
    logo_url = f"{str(request.base_url).rstrip('/')}/uploads/logos/{filename}"
    return {"logo_url": logo_url}


@router.get("/", response_model=list[schemas.ClinicOut])
def get_clinics(db: Session = Depends(get_db)):
    return (
        db.query(models.Clinic)
        .filter(models.Clinic.status != models.ClinicStatus.rejected)
        .all()
    )


@router.get("/me", response_model=schemas.ClinicResponse, summary="Joriy klinika ma'lumotlari")
def get_my_clinic(
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
    if payload.get("role") != "clinic":
        raise HTTPException(status_code=403, detail="Faqat klinika hisobi uchun ruxsat berilgan")

    try:
        clinic_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized

    clinic = db.query(models.Clinic).filter(models.Clinic.id == clinic_id).first()
    if clinic is None:
        raise HTTPException(status_code=404, detail="Klinika topilmadi")
    return clinic


@router.get("/{clinic_id}", response_model=schemas.ClinicOut)
def get_clinic(clinic_id: int, db: Session = Depends(get_db)):
    clinic = (
        db.query(models.Clinic)
        .filter(
            models.Clinic.id == clinic_id,
            models.Clinic.status != models.ClinicStatus.rejected,
        )
        .first()
    )
    if clinic is None:
        raise HTTPException(status_code=404, detail="Klinika topilmadi")
    return clinic