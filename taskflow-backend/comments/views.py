"""Equivalent of CommentsController."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from common.permissions import IsProjectMember
from . import services
from .serializers import CreateCommentSerializer


class CommentListCreateView(APIView):
    permission_classes = [IsProjectMember]

    def post(self, request, project_id, task_id):
        serializer = CreateCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = services.create_comment(task_id, project_id, request.user.id, **serializer.validated_data)
        return Response(comment.to_dict(), status=status.HTTP_201_CREATED)

    def get(self, request, project_id, task_id):
        comments = services.find_all(task_id, project_id)
        return Response([c.to_dict() for c in comments])


class CommentDeleteView(APIView):
    permission_classes = [IsProjectMember]

    def delete(self, request, project_id, task_id, comment_id):
        services.delete_comment(comment_id, project_id, request.user.id)
        return Response(status=status.HTTP_204_NO_CONTENT)
