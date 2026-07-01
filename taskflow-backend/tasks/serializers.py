from rest_framework import serializers
from .models import TaskStatus, TaskPriority


class CreateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=1, max_length=200, error_messages={
        'min_length': 'Title cannot be empty', 'blank': 'Title cannot be empty',
    })
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(choices=TaskStatus.choices, required=False)
    priority = serializers.ChoiceField(choices=TaskPriority.choices, required=False)
    dueDate = serializers.DateField(required=False, allow_null=True, source='due_date')
    assigneeId = serializers.UUIDField(required=False, allow_null=True, source='assignee_id')


class UpdateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=1, max_length=200, required=False, error_messages={
        'min_length': 'Title cannot be empty',
    })
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(choices=TaskStatus.choices, required=False)
    priority = serializers.ChoiceField(choices=TaskPriority.choices, required=False)
    dueDate = serializers.DateField(required=False, allow_null=True, source='due_date')
    # Explicit null clears the assignee -- mirrors the Nest DTO comment
    assigneeId = serializers.UUIDField(required=False, allow_null=True, source='assignee_id')


class TaskQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)
    status = serializers.ChoiceField(choices=TaskStatus.choices, required=False)
    priority = serializers.ChoiceField(choices=TaskPriority.choices, required=False)
    assigneeId = serializers.UUIDField(required=False, source='assignee_id')
    search = serializers.CharField(required=False, allow_blank=True)
    sortBy = serializers.ChoiceField(choices=['priority', 'dueDate', 'createdAt'], required=False, default='createdAt', source='sort_by')
    sortOrder = serializers.ChoiceField(choices=['ASC', 'DESC'], required=False, default='DESC', source='sort_order')
