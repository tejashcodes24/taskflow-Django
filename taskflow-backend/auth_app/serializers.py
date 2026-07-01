"""
Equivalent of SignupDto / LoginDto -- same validation rules as the
class-validator decorators in the Nest DTOs.
"""
import re
from rest_framework import serializers

PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$')


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=64)

    def validate_password(self, value):
        if not PASSWORD_PATTERN.match(value):
            raise serializers.ValidationError(
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            )
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
