from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(prefix="/clinics", tags=["Klinikalar"])


@router.get("/", response_model=List[schemas.ClinicOut], summary="Klinikalar ro'yxatini olish")
def get_clinics(db: Session = Depends(get_db)):
    clinics = db.query(models.Clinic).all()
    return clinics


@router.get("/{clinic_id}", response_model=schemas.ClinicOut, summary="Bitta klinikani olish")
def get_clinic(clinic_id: int, db: Session = Depends(get_db)):
    clinic = db.query(models.Clinic).filter(models.Clinic.id == clinic_id).first()
    if clinic is None:
        raise HTTPException(status_code=404, detail="Klinika topilmadi")
    return clinic
