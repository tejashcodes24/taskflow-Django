"""
ASGI config for the TaskFlow project.

Mounts the Django ASGI app and the python-socketio ASGI app together,
so a single Uvicorn process serves both REST (DRF) and the realtime
Socket.io gateway on the same port -- mirroring how Nest served HTTP
and the WebSocket gateway from one process.
"""
import asyncio
import os
import socketio
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from realtime.server import sio, set_main_loop

_socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=django_asgi_app,
    socketio_path='socket.io',
)


class TaskFlowASGI:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'lifespan':
            await self._handle_lifespan(receive, send)
        else:
            await self.app(scope, receive, send)

    async def _handle_lifespan(self, receive, send):
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                set_main_loop(asyncio.get_running_loop())
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                await send({'type': 'lifespan.shutdown.complete'})
                return


application = TaskFlowASGI(_socket_app)