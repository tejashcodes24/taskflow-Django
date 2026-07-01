from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView, ProjectMembersView,
    ProjectMemberInviteView, ProjectMemberRemoveView,
)

urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='projects-list-create'),
    path('<uuid:project_id>', ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:project_id>/members', ProjectMembersView.as_view(), name='project-members'),
    path('<uuid:project_id>/members/invite', ProjectMemberInviteView.as_view(), name='project-member-invite'),
    path('<uuid:project_id>/members/<uuid:user_id>', ProjectMemberRemoveView.as_view(), name='project-member-remove'),
]
