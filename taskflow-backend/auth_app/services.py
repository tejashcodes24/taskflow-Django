"""
Equivalent of AuthService -- signup, login, refresh (rotation), logout.
"""
import bcrypt
import hashlib
from datetime import datetime, timedelta, timezone
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.exceptions import AuthenticationFailed
from common.exceptions import ConflictException
from users.models import User
from .models import RefreshToken
from common.jwt_utils import sign_access_token, sign_refresh_token


def _hash_token(raw_token: str) -> str:
    # bcrypt has a hard 72-byte input limit and Python's bcrypt raises on
    # overflow (unlike Node's bcrypt, which silently truncates) -- so we
    # first collapse the JWT to a fixed-length SHA-256 digest, then bcrypt
    # that. This is also just better practice than relying on truncation.
    digest = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    return bcrypt.hashpw(digest.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')


def _check_token(raw_token: str, token_hash: str) -> bool:
    digest = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    try:
        return bcrypt.checkpw(digest.encode('utf-8'), token_hash.encode('utf-8'))
    except ValueError:
        return False


def _generate_tokens(user: User):
    access_token = sign_access_token(user.id, user.email)
    refresh_token = sign_refresh_token(user.id, user.email)

    token_hash = _hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    RefreshToken.objects.create(user=user, token_hash=token_hash, expires_at=expires_at)

    return {'accessToken': access_token, 'refreshToken': refresh_token, 'user': user}


def signup(name: str, email: str, password: str):
    if User.objects.filter(email=email).exists():
        raise ConflictException('Email already registered')

    password_hash = make_password(password)  # bcrypt, see PASSWORD_HASHERS
    user = User.objects.create(name=name, email=email, password=password_hash)

    return _generate_tokens(user)


def login(email: str, password: str):
    user = User.objects.filter(email=email).first()
    if not user or not check_password(password, user.password):
        raise AuthenticationFailed('Invalid credentials')

    return _generate_tokens(user)


def refresh(user: User, raw_refresh_token: str):
    tokens = RefreshToken.objects.filter(user=user, revoked=False)

    matched = None
    now = datetime.now(timezone.utc)
    for token in tokens:
        if _check_token(raw_refresh_token, token.token_hash) and token.expires_at > now:
            matched = token
            break

    if not matched:
        raise AuthenticationFailed('Invalid or expired refresh token')

    # Rotate: revoke old, issue new pair
    matched.revoked = True
    matched.save(update_fields=['revoked'])

    return _generate_tokens(user)


def logout(user: User, raw_refresh_token: str):
    tokens = RefreshToken.objects.filter(user=user, revoked=False)
    for token in tokens:
        if _check_token(raw_refresh_token, token.token_hash):
            token.revoked = True
            token.save(update_fields=['revoked'])
            break
