from rest_framework import serializers


class CreateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=100)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)


class UpdateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=100, required=False)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
