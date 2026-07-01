"""Equivalent of CommentsService."""
from rest_framework.exceptions import NotFound, PermissionDenied
from tasks.models import Task
from projects.models import Membership, MemberRole
from activity.models import ActivityEventType
from activity import services as activity_services
from realtime.server import emit_to_project
from .models import Comment


def create_comment(task_id, project_id, author_id, body):
    task = Task.objects.filter(id=task_id, project_id=project_id).first()
    if not task:
        raise NotFound('Task not found in this project')

    comment = Comment.objects.create(body=body, task_id=task_id, author_id=author_id)
    full = Comment.objects.select_related('author').get(id=comment.id)

    activity_services.log(project_id, author_id, ActivityEventType.COMMENT_ADDED, {
        'taskId': str(task_id), 'taskTitle': task.title,
        'commentId': str(comment.id), 'preview': body[:80],
    })

    emit_to_project(project_id, 'comment:created', {'taskId': str(task_id), 'comment': full.to_dict()})
    return full


def find_all(task_id, project_id):
    task = Task.objects.filter(id=task_id, project_id=project_id).first()
    if not task:
        raise NotFound('Task not found in this project')

    return list(Comment.objects.select_related('author').filter(task_id=task_id).order_by('created_at'))


def delete_comment(comment_id, project_id, actor_id):
    comment = Comment.objects.select_related('task').filter(id=comment_id).first()
    if not comment:
        raise NotFound('Comment not found')

    if str(comment.task.project_id) != str(project_id):
        raise PermissionDenied()

    is_author = str(comment.author_id) == str(actor_id)
    membership = Membership.objects.filter(user_id=actor_id, project_id=project_id).first()
    is_owner = membership is not None and membership.role == MemberRole.OWNER

    if not is_author and not is_owner:
        raise PermissionDenied('Only the comment author or project owner can delete this comment')

    task_id = comment.task_id
    comment.delete()

    emit_to_project(project_id, 'comment:deleted', {'commentId': str(comment_id), 'taskId': str(task_id)})
