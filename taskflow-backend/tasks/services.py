"""Equivalent of TasksService."""
import math
from datetime import date, datetime, timezone
from django.db.models import Case, When, Value, IntegerField, F
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from projects.models import Membership, MemberRole
from activity.models import ActivityEventType
from activity import services as activity_services
from realtime.server import emit_to_project, emit_to_user
from .models import Task, TaskStatus


def _assert_not_past_due(due_date):
    if due_date and due_date < date.today():
        raise ValidationError('Due date cannot be in the past')


def _assert_project_member(user_id, project_id):
    if not Membership.objects.filter(user_id=user_id, project_id=project_id).exists():
        raise ValidationError('Assignee must be a member of this project')


# ─── Create ─────────────────────────────────────────────────────────────────

def create_task(project_id, creator_id, **fields):
    # Only project owner can create tasks
    membership = Membership.objects.filter(user_id=creator_id, project_id=project_id).first()
    if not membership:
        raise PermissionDenied('You are not a member of this project')
    if membership.role != MemberRole.OWNER:
        raise PermissionDenied('Only the project owner can create tasks')

    _assert_not_past_due(fields.get('due_date'))

    assignee_id = fields.get('assignee_id')
    if assignee_id:
        _assert_project_member(assignee_id, project_id)

    task = Task.objects.create(project_id=project_id, created_by_id=creator_id, **fields)

    activity_services.log(project_id, creator_id, ActivityEventType.TASK_CREATED, {
        'taskId': str(task.id), 'taskTitle': task.title,
    })

    emit_to_project(project_id, 'task:created', task.to_dict())
    return task

# ─── List with pagination / filtering / sorting ────────────────────────────

def find_all(project_id, page=1, limit=20, status=None, priority=None, assignee_id=None,
             search=None, sort_by='created_at', sort_order='DESC'):
    qs = Task.objects.select_related('assignee', 'created_by').filter(project_id=project_id)

    if status:
        qs = qs.filter(status=status)
    if priority:
        qs = qs.filter(priority=priority)
    if assignee_id:
        qs = qs.filter(assignee_id=assignee_id)
    if search:
        qs = qs.filter(title__icontains=search)

    if sort_by == 'priority':
        qs = qs.annotate(
            priority_rank=Case(
                When(priority='high', then=Value(0)),
                When(priority='medium', then=Value(1)),
                default=Value(2),
                output_field=IntegerField(),
            )
        )
        order_field = 'priority_rank' if sort_order == 'ASC' else '-priority_rank'
    else:
        field_map = {'dueDate': 'due_date', 'createdAt': 'created_at', 'priority': 'priority'}
        db_field = field_map.get(sort_by, sort_by)
        order_field = db_field if sort_order == 'ASC' else f'-{db_field}'

    qs = qs.order_by(order_field)

    total = qs.count()
    start = (page - 1) * limit
    items = list(qs[start:start + limit])

    return {
        'data': [t.to_dict() for t in items],
        'total': total,
        'page': page,
        'totalPages': math.ceil(total / limit) if limit else 0,
    }


def get_board_tasks(project_id):
    tasks = list(
        Task.objects.select_related('assignee', 'created_by').filter(project_id=project_id).order_by('created_at')
    )
    return {
        TaskStatus.TODO: [t.to_dict() for t in tasks if t.status == TaskStatus.TODO],
        TaskStatus.IN_PROGRESS: [t.to_dict() for t in tasks if t.status == TaskStatus.IN_PROGRESS],
        TaskStatus.DONE: [t.to_dict() for t in tasks if t.status == TaskStatus.DONE],
    }


# ─── Get one ────────────────────────────────────────────────────────────────

def find_one(task_id, project_id):
    task = Task.objects.select_related('assignee', 'created_by').prefetch_related(
        'comments__author'
    ).filter(id=task_id, project_id=project_id).first()
    if not task:
        raise NotFound('Task not found')
    return task


# ─── Update ─────────────────────────────────────────────────────────────────

def update_task(task_id, project_id, actor_id, **fields):
    task = find_one(task_id, project_id)
    membership = Membership.objects.filter(user_id=actor_id, project_id=project_id).first()
    if not membership:
        raise PermissionDenied('Not a project member')

    new_status = fields.get('status')

    # Only owner or assignee can mark Done
    if new_status == TaskStatus.DONE:
        is_owner = membership.role == MemberRole.OWNER
        is_assignee = str(task.assignee_id) == str(actor_id)
        if not is_owner and not is_assignee:
            raise PermissionDenied('Only the task assignee or project owner can mark a task as Done')

    assignee_provided = 'assignee_id' in fields
    new_assignee_id = fields.get('assignee_id')
    if assignee_provided and new_assignee_id is not None:
        _assert_project_member(new_assignee_id, project_id)

    _assert_not_past_due(fields.get('due_date'))

    previous_status = task.status

    for key, value in fields.items():
        setattr(task, key, value)

    # completedAt logic
    if new_status == TaskStatus.DONE and previous_status != TaskStatus.DONE:
        task.completed_at = datetime.now(timezone.utc)
    elif new_status and new_status != TaskStatus.DONE and previous_status == TaskStatus.DONE:
        task.completed_at = None

    task.save()

    if new_status and new_status != previous_status:
        activity_services.log(project_id, actor_id, ActivityEventType.TASK_MOVED, {
            'taskId': str(task.id), 'taskTitle': task.title,
            'from': previous_status, 'to': new_status,
        })

    if assignee_provided:
        activity_services.log(project_id, actor_id, ActivityEventType.TASK_ASSIGNED, {
            'taskId': str(task.id), 'taskTitle': task.title,
            'assigneeId': str(new_assignee_id) if new_assignee_id else None,
        })

    full_task = find_one(task.id, project_id)

    emit_to_project(project_id, 'task:updated', full_task.to_dict(include_comments=True))
    if assignee_provided and new_assignee_id:
        emit_to_user(new_assignee_id, 'task:assigned', full_task.to_dict(include_comments=True))

    return full_task


# ─── Delete ─────────────────────────────────────────────────────────────────

def delete_task(task_id, project_id, actor_id):
    task = find_one(task_id, project_id)
    membership = Membership.objects.filter(user_id=actor_id, project_id=project_id).first()

    is_owner = membership is not None and membership.role == MemberRole.OWNER
    is_creator = str(task.created_by_id) == str(actor_id)
    if not is_owner and not is_creator:
        raise PermissionDenied('Only the task creator or project owner can delete this task')

    task_title = task.title
    task.delete()

    activity_services.log(project_id, actor_id, ActivityEventType.TASK_DELETED, {
        'taskId': str(task_id), 'taskTitle': task_title,
    })

    emit_to_project(project_id, 'task:deleted', {'taskId': str(task_id), 'projectId': str(project_id)})


# ─── Assigned to me, across all projects ───────────────────────────────────

def get_assigned_to_user(user_id):
    tasks = Task.objects.select_related('project', 'created_by').filter(assignee_id=user_id).order_by('-created_at')
    result = []
    for t in tasks:
        d = t.to_dict()
        d['project'] = t.project.to_dict()
        result.append(d)
    return result
