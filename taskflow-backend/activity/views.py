"""Equivalent of ActivityController -- GET /projects/:projectId/activity"""
from rest_framework.views import APIView
from rest_framework.response import Response
from common.permissions import IsProjectMember
from . import services


class ProjectActivityFeedView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id):
        logs = services.get_project_feed(project_id)
        return Response([log.to_dict() for log in logs])
