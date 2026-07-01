import uuid
from django.db import models
from users.models import User
from projects.models import Project


class ActivityEventType(models.TextChoices):
    TASK_CREATED = 'task_created', 'task_created'
    TASK_MOVED = 'task_moved', 'task_moved'
    TASK_ASSIGNED = 'task_assigned', 'task_assigned'
    TASK_DELETED = 'task_deleted', 'task_deleted'
    MEMBER_INVITED = 'member_invited', 'member_invited'
    MEMBER_REMOVED = 'member_removed', 'member_removed'
    COMMENT_ADDED = 'comment_added', 'comment_added'


class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='projectId', related_name='activity_logs')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, db_column='actorId', related_name='activity_logs')
    event_type = models.CharField(max_length=30, choices=ActivityEventType.choices, db_column='eventType')
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')

    class Meta:
        db_table = 'activity_logs'

    def to_dict(self):
        return {
            'id': str(self.id),
            'projectId': str(self.project_id),
            'actorId': str(self.actor_id),
            'actor': self.actor.to_public_dict(),
            'eventType': self.event_type,
            'metadata': self.metadata,
            'createdAt': self.created_at.isoformat(),
        }
