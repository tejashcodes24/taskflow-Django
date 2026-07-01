"""Equivalent of DashboardController."""
from rest_framework.views import APIView
from rest_framework.response import Response
from . import services


class DashboardView(APIView):
    def get(self, request):
        return Response(services.get_dashboard(request.user.id))
