import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.db import get_db
import models.models as models
import schemas.schemas as schemas
from .clinics import IMAGE_TYPES, MAX_LOGO_SIZE, PHONE_PATTERN, UPLOADS_DIR, normalize_telefon
from .services import bearer_scheme, get_current_clinic_id

router = APIRouter(prefix="/clinics/doctors", tags=["Klinika shifokorlari"])
PHOTOS_DIR = UPLOADS_DIR / "doctors"


def to_out(d: models.Doctor) -> schemas.DoctorOut:
    return schemas.DoctorOut(
        id=d.id,
        clinic_id=d.clinic_id,
        name=d.name,
        telefon=d.telefon,
        experience=d.experience,
        photo_url=d.photo_url,
        service_id=d.service_id,
        specialty=d.service.name,
        price=d.service.price,
    )


@router.post("/upload-photo", summary="Doktor rasmini yuklash")
async def upload_doctor_photo(
    request: Request,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    get_current_clinic_id(credentials)
    image_type = IMAGE_TYPES.get(file.content_type or "")
    if image_type is None:
        raise HTTPException(status_code=400, detail="Faqat rasm fayllarini yuklash mumkin")

    content = await file.read(MAX_LOGO_SIZE + 1)
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(status_code=413, detail="Rasm hajmi 5 MB dan oshmasligi kerak")
    if not image_type[1](content):
        raise HTTPException(status_code=400, detail="Yuklangan fayl haqiqiy rasm emas")

    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{image_type[0]}"
    (PHOTOS_DIR / filename).write_bytes(content)
    return {"photo_url": f"{str(request.base_url).rstrip('/')}/uploads/doctors/{filename}"}


@router.get("/me", response_model=list[schemas.DoctorOut], summary="Klinika shifokorlari")
def get_my_doctors(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    doctors = (
        db.query(models.Doctor)
        .filter(models.Doctor.clinic_id == clinic_id)
        .order_by(models.Doctor.id.desc())
        .all()
    )
    return [to_out(d) for d in doctors]


@router.post(
    "",
    response_model=schemas.DoctorOut,
    status_code=status.HTTP_201_CREATED,
    summary="Klinikaga shifokor qo'shish",
)
def add_doctor(
    data: schemas.DoctorCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Shifokor ismi kiritilishi shart")

    telefon = normalize_telefon(data.telefon)
    if not PHONE_PATTERN.fullmatch(telefon):
        raise HTTPException(status_code=400, detail="Telefon +998XXXXXXXXX formatida bo'lishi kerak")

    if db.query(models.Doctor).filter(func.replace(models.Doctor.telefon, " ", "") == telefon).first():
        raise HTTPException(status_code=400, detail="Bu telefon raqamli shifokor allaqachon qo'shilgan")

    # xizmat shu klinikaniki va faol bo'lishi shart
    service = (
        db.query(models.Service)
        .filter(
            models.Service.id == data.service_id,
            models.Service.clinic_id == clinic_id,
            models.Service.active == 1,
        )
        .first()
    )
    if service is None:
        raise HTTPException(status_code=400, detail="Tanlangan mutaxassislik topilmadi")

    doctor = models.Doctor(
        clinic_id=clinic_id,
        service_id=service.id,
        name=name,
        telefon=telefon,
        experience=(data.experience or "").strip() or None,
        photo_url=data.photo_url,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return to_out(doctor)


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Shifokorni o'chirish")
def delete_doctor(
    doctor_id: int,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    doctor = (
        db.query(models.Doctor)
        .filter(models.Doctor.id == doctor_id, models.Doctor.clinic_id == clinic_id)
        .first()
    )
    if doctor is None:
        raise HTTPException(status_code=404, detail="Shifokor topilmadi")
    db.delete(doctor)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)