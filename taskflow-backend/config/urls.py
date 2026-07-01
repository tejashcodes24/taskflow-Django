"""
Root URL config -- mirrors the route prefixes the NestJS controllers used,
so the frontend's axios baseURL + relative paths need zero changes.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('auth/', include('auth_app.urls')),
    path('users/', include('users.urls')),
    path('projects/', include('projects.urls')),

    # tasks, comments, activity all declare their own full sub-paths
    # (e.g. 'projects/<id>/tasks/...') because they're nested under projects/tasks
    # in ways that don't fit a clean single prefix -- mirrors how Nest's
    # @Controller() decorators specified full paths directly.
    path('', include('tasks.urls')),
    path('', include('comments.urls')),
    path('', include('activity.urls')),

    path('dashboard/', include('dashboard.urls')),
]
