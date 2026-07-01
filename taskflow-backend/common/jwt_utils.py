"""
Token sign/verify helpers, equivalent to @nestjs/jwt's JwtService.sign/verify
with per-call secret + expiresIn strings like '15m' / '7d'.
"""
import re
import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings


def _parse_expires_in(value: str) -> timedelta:
    """Parses Nest-style expiresIn strings: '15m', '7d', '3600s', or plain seconds."""
    if isinstance(value, (int, float)):
        return timedelta(seconds=value)
    match = re.match(r'^(\d+)([smhd])$', str(value).strip())
    if not match:
        # fall back: assume raw seconds
        return timedelta(seconds=int(value))
    amount, unit = int(match.group(1)), match.group(2)
    unit_map = {'s': 'seconds', 'm': 'minutes', 'h': 'hours', 'd': 'days'}
    return timedelta(**{unit_map[unit]: amount})


def sign_token(payload: dict, secret: str, expires_in: str) -> str:
    to_encode = dict(payload)
    now = datetime.now(timezone.utc)
    to_encode['iat'] = int(now.timestamp())
    to_encode['exp'] = int((now + _parse_expires_in(expires_in)).timestamp())
    return jwt.encode(to_encode, secret, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str, secret: str) -> dict:
    """Raises jwt exceptions (ExpiredSignatureError, InvalidTokenError) on failure."""
    return jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])


def sign_access_token(user_id: str, email: str) -> str:
    return sign_token({'sub': str(user_id), 'email': email}, settings.JWT_ACCESS_SECRET, settings.JWT_ACCESS_EXPIRES)


def sign_refresh_token(user_id: str, email: str) -> str:
    return sign_token({'sub': str(user_id), 'email': email}, settings.JWT_REFRESH_SECRET, settings.JWT_REFRESH_EXPIRES)
