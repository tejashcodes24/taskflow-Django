"""
Equivalent of AuthController -- signup/login/refresh/logout, setting the
same httpOnly refresh_token cookie the frontend already expects.
"""
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from common.authentication import JWTRefreshCookieAuthentication
from . import services
from .serializers import SignupSerializer, LoginSerializer


def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        max_age=settings.REFRESH_COOKIE_MAX_AGE,
    )


class SignupView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = services.signup(**serializer.validated_data)

        response = Response({
            'accessToken': data['accessToken'],
            'user': data['user'].to_public_dict(),
        }, status=status.HTTP_201_CREATED)
        _set_refresh_cookie(response, data['refreshToken'])
        return response


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = services.login(**serializer.validated_data)

        response = Response({
            'accessToken': data['accessToken'],
            'user': data['user'].to_public_dict(),
        }, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, data['refreshToken'])
        return response


class RefreshView(APIView):
    authentication_classes = [JWTRefreshCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = services.refresh(request.user, request.raw_refresh_token)

        response = Response({
            'accessToken': data['accessToken'],
            'user': request.user.to_public_dict(),
        }, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, data['refreshToken'])
        return response


class LogoutView(APIView):
    authentication_classes = [JWTRefreshCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        services.logout(request.user, request.raw_refresh_token)

        response = Response({'message': 'Logged out'}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.REFRESH_COOKIE_NAME)
        return response
