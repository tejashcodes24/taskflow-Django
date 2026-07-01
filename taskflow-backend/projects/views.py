"""Equivalent of ProjectsController."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from common.permissions import IsProjectMember
from . import services
from .serializers import CreateProjectSerializer, UpdateProjectSerializer, InviteMemberSerializer


class ProjectListCreateView(APIView):
    def post(self, request):
        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = services.create_project(request.user.id, **serializer.validated_data)
        return Response(project.to_dict(), status=status.HTTP_201_CREATED)

    def get(self, request):
        projects = services.find_all_for_user(request.user.id)
        return Response([p.to_dict(include_members=True) for p in projects])


class ProjectDetailView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id):
        project = services.find_one(project_id)
        return Response(project.to_dict(include_members=True))

    def patch(self, request, project_id):
        serializer = UpdateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = services.update_project(project_id, request.user.id, **serializer.validated_data)
        return Response(project.to_dict(include_members=True))

    def delete(self, request, project_id):
        services.delete_project(project_id, request.user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectMembersView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id):
        members = services.get_members(project_id)
        return Response([m.to_dict(include_user=True) for m in members])


class ProjectMemberInviteView(APIView):
    permission_classes = [IsProjectMember]

    def post(self, request, project_id):
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = services.invite_member(project_id, request.user.id, **serializer.validated_data)
        return Response(membership.to_dict(include_user=True), status=status.HTTP_201_CREATED)


class ProjectMemberRemoveView(APIView):
    permission_classes = [IsProjectMember]

    def delete(self, request, project_id, user_id):
        services.remove_member(project_id, request.user.id, user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
