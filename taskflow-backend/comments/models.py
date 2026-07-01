import uuid
from django.db import models
from users.models import User
from tasks.models import Task


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField()
    task = models.ForeignKey(Task, on_delete=models.CASCADE, db_column='taskId', related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, db_column='authorId', related_name='comments')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')

    class Meta:
        db_table = 'comments'

    def to_dict(self):
        return {
            'id': str(self.id),
            'body': self.body,
            'taskId': str(self.task_id),
            'authorId': str(self.author_id),
            'author': self.author.to_public_dict(),
            'createdAt': self.created_at.isoformat(),
        }
