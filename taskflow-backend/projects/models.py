import uuid
from django.db import models
from users.models import User


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=500, null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, db_column='ownerId', related_name='owned_projects')
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')
    updated_at = models.DateTimeField(auto_now=True, db_column='updatedAt')

    class Meta:
        db_table = 'projects'

    def to_dict(self, include_members=False):
        data = {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'ownerId': str(self.owner_id),
            'owner': self.owner.to_public_dict(),
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
        }
        if include_members:
            data['memberships'] = [m.to_dict(include_user=True) for m in self.memberships.select_related('user').all()]
        return data


class MemberRole(models.TextChoices):
    OWNER = 'owner', 'owner'
    MEMBER = 'member', 'member'


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='userId', related_name='memberships')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='projectId', related_name='memberships')
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True, db_column='joinedAt')

    class Meta:
        db_table = 'memberships'
        constraints = [
            models.UniqueConstraint(fields=['user', 'project'], name='unique_user_project_membership'),
        ]

    def to_dict(self, include_user=False):
        data = {
            'id': str(self.id),
            'userId': str(self.user_id),
            'projectId': str(self.project_id),
            'role': self.role,
            'joinedAt': self.joined_at.isoformat(),
        }
        if include_user:
            data['user'] = self.user.to_public_dict()
        return data
