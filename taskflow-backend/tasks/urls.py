from django.urls import path
from .views import AssignedToMeView, TaskListCreateView, TaskBoardView, TaskDetailView

urlpatterns = [
    # Declared first -- must not collide with the projects/:projectId/tasks routes
    path('users/me/assigned', AssignedToMeView.as_view(), name='tasks-assigned-to-me'),

    path('projects/<uuid:project_id>/tasks', TaskListCreateView.as_view(), name='tasks-list-create'),
    path('projects/<uuid:project_id>/tasks/board', TaskBoardView.as_view(), name='tasks-board'),
    path('projects/<uuid:project_id>/tasks/<uuid:task_id>', TaskDetailView.as_view(), name='task-detail'),
]
