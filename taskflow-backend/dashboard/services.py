"""Equivalent of DashboardService."""
from datetime import datetime, timedelta, timezone
from django.db.models import Count, Q
from projects.models import Membership
from tasks.models import Task, TaskStatus
from activity import services as activity_services


def get_dashboard(user_id):
    memberships = Membership.objects.select_related('project').filter(user_id=user_id)
    project_ids = [m.project_id for m in memberships]
    project_count = len(project_ids)

    empty_status = {'todo': 0, 'in_progress': 0, 'done': 0}

    if project_count == 0:
        return {
            'projectCount': 0,
            'assignedByStatus': empty_status,
            'totalByStatus': empty_status,
            'completedThisWeek': 0,
            'busiestProject': None,
            'recentActivity': [],
        }

    def status_counts(qs):
        return {
            'todo': qs.filter(status=TaskStatus.TODO).count(),
            'in_progress': qs.filter(status=TaskStatus.IN_PROGRESS).count(),
            'done': qs.filter(status=TaskStatus.DONE).count(),
        }

    assigned_qs = Task.objects.filter(assignee_id=user_id, project_id__in=project_ids)
    assigned_by_status = status_counts(assigned_qs)

    all_qs = Task.objects.filter(project_id__in=project_ids)
    total_by_status = status_counts(all_qs)

    # Monday of the current week, midnight UTC
    now = datetime.now(timezone.utc)
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)

    completed_this_week = Task.objects.filter(
        project_id__in=project_ids, status=TaskStatus.DONE, completed_at__gte=start_of_week,
    ).count()

    busiest = (
        Task.objects.filter(project_id__in=project_ids)
        .exclude(status=TaskStatus.DONE)
        .values('project_id', 'project__name')
        .annotate(open_count=Count('id'))
        .order_by('-open_count')
        .first()
    )

    recent_activity = activity_services.get_user_feed(project_ids, 20)

    return {
        'projectCount': project_count,
        'assignedByStatus': assigned_by_status,
        'totalByStatus': total_by_status,
        'completedThisWeek': completed_this_week,
        'busiestProject': {
            'projectId': str(busiest['project_id']),
            'name': busiest['project__name'],
            'openTaskCount': busiest['open_count'],
        } if busiest else None,
        'recentActivity': [a.to_dict() for a in recent_activity],
    }
