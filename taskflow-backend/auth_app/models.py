import uuid
from django.db import models
from users.models import User


class RefreshToken(models.Model):
    """Mirrors refresh_tokens table. Stores a hash, never the raw token."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_hash = models.CharField(max_length=255, db_column='tokenHash')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens', db_column='userId')
    expires_at = models.DateTimeField(db_column='expiresAt')
    revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_column='createdAt')

    class Meta:
        db_table = 'refresh_tokens'
