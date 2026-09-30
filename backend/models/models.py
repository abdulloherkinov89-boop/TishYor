from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SqlEnum, Float, Integer, String

from database.db import Base


class ClinicStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    ism = Column(String, nullable=False)
    familiya = Column(String, nullable=False)
    telefon = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, default="patient", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    telefon = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    patients_served = Column(Integer, nullable=True)
    license_number = Column(String, nullable=True)
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    status = Column(
        SqlEnum(
            ClinicStatus,
            values_callable=lambda enum_class: [item.value for item in enum_class],
            native_enum=False,
            validate_strings=True,
        ),
        default=ClinicStatus.pending,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    tag = Column(String, default="KLINIKA")
    rating = Column(String, default="Yangi")
    gradient_start = Column(String, default="#7F77DD")
    gradient_end = Column(String, default="#5742A9")