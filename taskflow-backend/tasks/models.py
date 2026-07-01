import uuid
from django.db import models
from users.models import User
from projects.models import Project


class TaskStatus(models.TextChoices):
    TODO = 'todo', 'todo'
    IN_PROGRESS = 'in_progress', 'in_progress'
    DONE = 'done', 'done'


class TaskPriority(models.TextChoices):
    LOW = 'low', 'low'
    MEDIUM = 'medium', 'medium'
    HIGH = 'high', 'high'


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='projectId', related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO)
    priority = models.CharField(max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM)
    due_date = models.DateField(null=True, blank=True, db_column='dueDate')
    completed_at = models.DateTimeField(null=True, blank=True, db_column='completedAt')
    assignee = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        db_column='assigneeId', related_name='assigned_tasks',
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE,
        db_column='createdById', related_name='created_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'tasks'

    def to_dict(self, include_comments=False):
        data = {
            'id': str(self.id),
            'projectId': str(self.project_id),
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'assigneeId': str(self.assignee_id) if self.assignee_id else None,
            'assignee': self.assignee.to_public_dict() if self.assignee_id else None,
            'createdById': str(self.created_by_id),
            'createdBy': self.created_by.to_public_dict(),
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
        }
        if include_comments:
            data['comments'] = [c.to_dict() for c in self.comments.select_related('author').order_by('created_at')]
        return data
