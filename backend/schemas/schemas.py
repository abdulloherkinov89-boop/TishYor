from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.models import ClinicStatus


class UserCreate(BaseModel):
    ism: str
    familiya: str
    telefon: str
    role: str = "patient"


class LoginRequest(BaseModel):
    telefon: str


class UserOut(BaseModel):
    id: int
    ism: str
    familiya: str
    telefon: str
    role: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ClinicRegister(BaseModel):
    name: str
    telefon: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    patients_served: Optional[int] = None
    license_number: Optional[str] = None
    description: str | None = None
    logo_url: str | None = None


class ClinicCreated(BaseModel):
    id: int
    name: str
    status: ClinicStatus


class ClinicRegisterResponse(BaseModel):
    clinic: ClinicCreated
    access_token: str
    token_type: str = "bearer"
    role: str = "clinic"


class ClinicResponse(BaseModel):
    id: int
    name: str
    telefon: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    patients_served: Optional[int] = None
    license_number: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    status: ClinicStatus
    created_at: datetime
    tag: str
    rating: str
    gradient_start: str
    gradient_end: str

    class Config:
        from_attributes = True


class ClinicOut(BaseModel):
    id: int
    name: str
    tag: str
    description: str | None = None
    logo_url: str | None = None
    rating: str
    address: str
    gradient_start: str
    gradient_end: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    patients_served: Optional[int] = None
    license_number: Optional[str] = None
    status: ClinicStatus

    class Config:
        from_attributes = True


# creat hizmat va narxlar schems
class ServiceCreate(BaseModel):
    name: str
    price: float
    duration: Optional[str] = "30"

class ServiceUpdate(BaseModel):
    price: Optional[float] = None
    price_from: Optional[bool] = False
    duration: Optional[str] = None
    active: Optional[bool] = True

class ServiceOut(BaseModel):
    id: int
    clinic_id: int
    name: str
    category: str
    price: float
    price_from: bool
    duration: str
    active: bool

    class Config:
        from_attributes = True