"""Equivalent of ActivityService."""
from .models import ActivityLog


def log(project_id, actor_id, event_type, metadata=None):
    return ActivityLog.objects.create(
        project_id=project_id, actor_id=actor_id, event_type=event_type, metadata=metadata or {}
    )


def get_project_feed(project_id, limit=50):
    return list(
        ActivityLog.objects.select_related('actor').filter(project_id=project_id).order_by('-created_at')[:limit]
    )


def get_user_feed(project_ids, limit=20):
    if not project_ids:
        return []
    return list(
        ActivityLog.objects.select_related('actor').filter(project_id__in=project_ids).order_by('-created_at')[:limit]
    )
