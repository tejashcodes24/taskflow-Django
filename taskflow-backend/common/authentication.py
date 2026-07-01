"""
DRF authentication classes equivalent to JwtStrategy (Bearer access token)
and JwtRefreshStrategy (httpOnly refresh cookie) in the Nest app.
"""
import jwt as pyjwt
from django.conf import settings
from rest_framework import authentication, exceptions
from users.models import User
from .jwt_utils import verify_token


class JWTAccessTokenAuthentication(authentication.BaseAuthentication):
    """Equivalent of JwtStrategy: reads 'Authorization: Bearer <token>'."""

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        if not auth_header or not auth_header.startswith(f'{self.keyword} '):
            return None  # no creds supplied -- let DRF fall through to IsAuthenticated->401

        token = auth_header[len(self.keyword) + 1:]
        try:
            payload = verify_token(token, settings.JWT_ACCESS_SECRET)
        except pyjwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token expired')
        except pyjwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')

        try:
            user = User.objects.get(id=payload['sub'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')

        return (user, token)


class JWTRefreshCookieAuthentication(authentication.BaseAuthentication):
    """
    Equivalent of JwtRefreshStrategy: reads the httpOnly 'refresh_token' cookie,
    verifies signature, and exposes (user, raw_token) so the view can hash-compare
    against the stored RefreshToken rows. Used only on /auth/refresh and /auth/logout.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not raw_token:
            raise exceptions.AuthenticationFailed('No refresh token cookie')

        try:
            payload = verify_token(raw_token, settings.JWT_REFRESH_SECRET)
        except pyjwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Refresh token expired')
        except pyjwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid refresh token')

        try:
            user = User.objects.get(id=payload['sub'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')

        # Stash the raw token on the request so the view can hash-compare it
        request.raw_refresh_token = raw_token
        return (user, raw_token)
