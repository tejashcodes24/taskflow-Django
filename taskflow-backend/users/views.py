"""Equivalent of UsersController -- GET /users/me"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from common.authentication import JWTAccessTokenAuthentication, JWTRefreshCookieAuthentication
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    # Try Bearer token first, fall back to refresh cookie
    authentication_classes = [JWTAccessTokenAuthentication, JWTRefreshCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(request.user.to_public_dict(), status=status.HTTP_200_OK)
