from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.auth import create_access_token
from database.db import get_db
from models.models import User
from schemas.schemas import TokenResponse, UserCreate


router = APIRouter(prefix="/auth", tags=["Ro'yxatdan o'tish"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Foydalanuvchini ro'yxatdan o'tkazish",
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yangi bemorni ro'yxatdan o'tkazadi va JWT qaytaradi."""
    existing_user = db.query(User).filter(User.telefon == user_data.telefon).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu raqam bilan allaqachon ro'yxatdan o'tilgan",
        )

    user = User(
        ism=user_data.ism,
        familiya=user_data.familiya,
        telefon=user_data.telefon,
        role="patient",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.telefon)
    return TokenResponse(access_token=token, user=user)