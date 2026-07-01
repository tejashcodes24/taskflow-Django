"""Equivalent of ProjectsService."""
from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from common.exceptions import ConflictException
from users.models import User
from tasks.models import Task
from activity.models import ActivityEventType
from activity import services as activity_services
from .models import Project, Membership, MemberRole


# ─── Create ─────────────────────────────────────────────────────────────────

def create_project(user_id, name, description=None):
    with transaction.atomic():
        project = Project.objects.create(name=name, description=description, owner_id=user_id)
        Membership.objects.create(user_id=user_id, project=project, role=MemberRole.OWNER)

    activity_services.log(
        project.id, user_id, ActivityEventType.MEMBER_INVITED,
        {'invitedUserId': str(user_id), 'note': 'Project created'},
    )
    return project


# ─── Read ───────────────────────────────────────────────────────────────────

def find_all_for_user(user_id):
    return list(
        Project.objects.filter(memberships__user_id=user_id)
        .prefetch_related('memberships__user')
        .select_related('owner')
        .order_by('-created_at')
        .distinct()
    )


def find_one(project_id):
    project = Project.objects.select_related('owner').prefetch_related('memberships__user').filter(id=project_id).first()
    if not project:
        raise NotFound('Project not found')
    return project


# ─── Update / Delete ────────────────────────────────────────────────────────

def update_project(project_id, user_id, **fields):
    _assert_owner(project_id, user_id)
    Project.objects.filter(id=project_id).update(**{k: v for k, v in fields.items() if v is not None})
    return find_one(project_id)


def delete_project(project_id, user_id):
    _assert_owner(project_id, user_id)
    Project.objects.filter(id=project_id).delete()  # cascades via on_delete=CASCADE


# ─── Membership ─────────────────────────────────────────────────────────────

def invite_member(project_id, actor_id, email):
    _assert_owner(project_id, actor_id)

    invitee = User.objects.filter(email=email).first()
    if not invitee:
        raise NotFound('No user found with that email')

    if Membership.objects.filter(user_id=invitee.id, project_id=project_id).exists():
        raise ConflictException('User is already a member of this project')

    membership = Membership.objects.create(user=invitee, project_id=project_id, role=MemberRole.MEMBER)

    activity_services.log(project_id, actor_id, ActivityEventType.MEMBER_INVITED, {
        'invitedUserId': str(invitee.id),
        'invitedUserName': invitee.name,
        'invitedUserEmail': invitee.email,
    })
    return membership


def remove_member(project_id, actor_id, target_user_id):
    _assert_owner(project_id, actor_id)

    if str(actor_id) == str(target_user_id):
        raise ValidationError('Owner cannot remove themselves. Delete the project instead.')

    membership = Membership.objects.filter(user_id=target_user_id, project_id=project_id).first()
    if not membership:
        raise NotFound('Member not found in this project')

    membership.delete()

    # Auto-unassign tasks in this project that were assigned to the removed user
    Task.objects.filter(project_id=project_id, assignee_id=target_user_id).update(assignee_id=None)

    removed_user = User.objects.filter(id=target_user_id).first()

    activity_services.log(project_id, actor_id, ActivityEventType.MEMBER_REMOVED, {
        'removedUserId': str(target_user_id),
        'removedUserName': removed_user.name if removed_user else None,
    })


def get_members(project_id):
    return list(Membership.objects.select_related('user').filter(project_id=project_id))


# ─── Helpers ────────────────────────────────────────────────────────────────

def get_membership(user_id, project_id):
    return Membership.objects.filter(user_id=user_id, project_id=project_id).first()


def _assert_owner(project_id, user_id):
    membership = Membership.objects.filter(user_id=user_id, project_id=project_id).first()
    if not membership or membership.role != MemberRole.OWNER:
        raise PermissionDenied('Only the project owner can perform this action')
