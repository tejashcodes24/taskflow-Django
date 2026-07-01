from rest_framework import serializers


class CreateCommentSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1, max_length=2000, error_messages={
        'min_length': 'Comment cannot be empty', 'blank': 'Comment cannot be empty',
    })
