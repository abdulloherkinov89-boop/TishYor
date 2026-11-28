import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy import func


SECRET_KEY = "tishyor-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
UZ_PHONE_DIGITS_RE = re.compile(r"^998\d{9}$")


def extract_uz_phone_digits(telefon: str) -> str:
    """Telefon raqamidan raqamlarni ajratib, 9 xonali bo'lsa 998 qo'shadi."""
    digits = re.sub(r"\D", "", telefon or "")
    if len(digits) == 9:
        digits = "998" + digits
    return digits


def normalize_uz_phone(telefon: str) -> str:
    """O'zbekiston telefon raqamini tekshiradi va +998XXXXXXXXX ko'rinishiga keltiradi."""
    digits = extract_uz_phone_digits(telefon)
    if not UZ_PHONE_DIGITS_RE.fullmatch(digits):
        raise ValueError("Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak")
    return f"+{digits}"


def phone_lookup_expression(column):
    """Bazadagi telefon ustunidan ajratuvchi belgilarni olib tashlab solishtirish ifodasini qaytaradi."""
    expression = func.replace(column, " ", "")
    for separator in ("+", "(", ")", "-", "."):
        expression = func.replace(expression, separator, "")
    return expression


def create_access_token(user_id: int, telefon: str, role: str = "patient") -> str:
    """Foydalanuvchi uchun 30 kun amal qiladigan JWT yaratadi."""
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "telefon": telefon, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """JWTni tekshiradi va yaroqsiz token uchun None qaytaradi."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except (JWTError, ValueError, TypeError):
        return None