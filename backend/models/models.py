from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String

from database.db import Base


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
    address = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String)
    price_range = Column(String)
    is_24h = Column(Boolean, default=False)
