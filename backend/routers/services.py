from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from auth.auth import decode_access_token
from database.db import get_db
import models.models as models
import schemas.schemas as schemas

router = APIRouter(prefix="/clinics/services", tags=["Klinika xizmatlari"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_clinic_id(
    credentials: HTTPAuthorizationCredentials | None,
) -> int:
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
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized


def get_clinic_service(service_id: int, clinic_id: int, db: Session) -> models.Service:
    service = (
        db.query(models.Service)
        .filter(
            models.Service.id == service_id,
            models.Service.clinic_id == clinic_id,
        )
        .first()
    )
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return service


@router.get("/me", response_model=list[schemas.ServiceOut], summary="Joriy klinika xizmatlarini olish")
def get_my_services(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    return db.query(models.Service).filter(models.Service.clinic_id == clinic_id).all()


@router.get("/{service_id}", response_model=schemas.ServiceOut, summary="Klinika xizmatini olish")
def get_service(
    service_id: int,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    return get_clinic_service(service_id, clinic_id, db)


@router.post(
    "",
    response_model=schemas.ServiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Klinikaga yangi xizmat qo'shish",
)
def add_service(
    data: schemas.ServiceCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    if not data.name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Xizmat nomi kiritilishi shart")

    service = models.Service(
        clinic_id=clinic_id,
        name=data.name.strip(),
        category="Asosiy xizmatlar",
        price=data.price,
        price_from=0,
        duration=data.duration or "30",
        active=1,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=schemas.ServiceOut, summary="Klinika xizmatini yangilash")
def update_service(
    service_id: int,
    data: schemas.ServiceUpdate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    service = get_clinic_service(service_id, clinic_id, db)
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash uchun maydon yuboring")

    for field, value in updates.items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xizmatni o'chirish")
def delete_service(
    service_id: int,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    clinic_id = get_current_clinic_id(credentials)
    service = get_clinic_service(service_id, clinic_id, db)
    db.delete(service)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)