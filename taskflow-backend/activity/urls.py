from django.urls import path
from .views import ProjectActivityFeedView

urlpatterns = [
    path('projects/<uuid:project_id>/activity', ProjectActivityFeedView.as_view(), name='project-activity-feed'),
]
