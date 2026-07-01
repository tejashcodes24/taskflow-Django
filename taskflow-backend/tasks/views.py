"""Equivalent of TasksController."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from common.permissions import IsProjectMember
from . import services
from .serializers import CreateTaskSerializer, UpdateTaskSerializer, TaskQuerySerializer


class AssignedToMeView(APIView):
    """GET /users/me/assigned -- declared separately, no projectId in path."""

    def get(self, request):
        tasks = services.get_assigned_to_user(request.user.id)
        return Response(tasks)


class TaskListCreateView(APIView):
    permission_classes = [IsProjectMember]

    def post(self, request, project_id):
        serializer = CreateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = services.create_task(project_id, request.user.id, **serializer.validated_data)
        return Response(task.to_dict(), status=status.HTTP_201_CREATED)

    def get(self, request, project_id):
        query = TaskQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        result = services.find_all(project_id, **query.validated_data)
        return Response(result)


class TaskBoardView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id):
        return Response(services.get_board_tasks(project_id))


class TaskDetailView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id, task_id):
        task = services.find_one(task_id, project_id)
        return Response(task.to_dict(include_comments=True))

    def patch(self, request, project_id, task_id):
        serializer = UpdateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = services.update_task(task_id, project_id, request.user.id, **serializer.validated_data)
        return Response(task.to_dict(include_comments=True))

    def delete(self, request, project_id, task_id):
        services.delete_task(task_id, project_id, request.user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)
