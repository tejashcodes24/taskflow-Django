"""
Equivalent of ProjectMemberGuard. Reads projectId from the URL kwargs,
verifies membership, and attaches it to the request as request.membership.
"""
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from projects.models import Membership


class IsProjectMember(BasePermission):
    message = 'You are not a member of this project'

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id')
        user = request.user

        if not user or not user.is_authenticated or not project_id:
            raise PermissionDenied()

        membership = Membership.objects.select_related('user', 'project').filter(
            user_id=user.id, project_id=project_id
        ).first()

        if not membership:
            raise PermissionDenied(self.message)

        request.membership = membership
        return True
