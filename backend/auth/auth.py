from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt


SECRET_KEY = "tishyor-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: int, telefon: str) -> str:
    """Foydalanuvchi uchun 30 kun amal qiladigan JWT yaratadi."""
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "telefon": telefon, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """JWTni tekshiradi va yaroqsiz token uchun None qaytaradi."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except (JWTError, ValueError, TypeError):
        return None