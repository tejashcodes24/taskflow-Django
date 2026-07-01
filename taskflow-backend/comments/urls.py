from django.urls import path
from .views import CommentListCreateView, CommentDeleteView

urlpatterns = [
    path('projects/<uuid:project_id>/tasks/<uuid:task_id>/comments', CommentListCreateView.as_view(), name='comments-list-create'),
    path('projects/<uuid:project_id>/tasks/<uuid:task_id>/comments/<uuid:comment_id>', CommentDeleteView.as_view(), name='comment-delete'),
]
