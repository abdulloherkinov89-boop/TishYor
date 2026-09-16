from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    ism: str
    familiya: str
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


class ClinicOut(BaseModel):
    id: int
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    price_range: Optional[str] = None
    is_24h: bool

    class Config:
        from_attributes = True

