"""
Equivalent of EventsGateway. Uses python-socketio's AsyncServer so the
frontend's `socket.io-client` connects with zero changes (same protocol,
same auth handshake shape: io(url, { auth: { token } })).

This module exposes a single `sio` instance plus emit_to_project /
emit_to_user helpers that Django views call synchronously after DB writes
(see tasks/services.py).
"""
import asyncio
import logging
import jwt as pyjwt
import socketio
from django.conf import settings
from common.jwt_utils import verify_token

logger = logging.getLogger('realtime')

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[settings.FRONTEND_URL],
)

# Captured at startup in config/asgi.py
_main_loop: asyncio.AbstractEventLoop | None = None


def set_main_loop(loop: asyncio.AbstractEventLoop):
    global _main_loop
    _main_loop = loop
    logger.info('Main event loop captured for realtime emitters')


_socket_user_map: dict[str, str] = {}


@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get('token')
    if not token:
        raise socketio.exceptions.ConnectionRefusedError('No token provided')

    try:
        payload = verify_token(token, settings.JWT_ACCESS_SECRET)
    except pyjwt.ExpiredSignatureError:
        raise socketio.exceptions.ConnectionRefusedError('Token expired')
    except pyjwt.InvalidTokenError:
        raise socketio.exceptions.ConnectionRefusedError('Invalid token')

    user_id = payload['sub']
    _socket_user_map[sid] = user_id
    await sio.enter_room(sid, f'user:{user_id}')
    logger.info('Client connected: %s (user: %s)', sid, user_id)


@sio.event
async def disconnect(sid):
    logger.info('Client disconnected: %s', sid)
    _socket_user_map.pop(sid, None)


@sio.on('join:project')
async def join_project(sid, project_id):
    from asgiref.sync import sync_to_async

    user_id = _socket_user_map.get(sid)
    if not user_id:
        await sio.emit('error', {'message': 'Not authenticated'}, to=sid)
        return

    is_member = await sync_to_async(_check_membership, thread_sensitive=True)(user_id, project_id)
    if not is_member:
        await sio.emit('error', {'message': 'Not a member of this project'}, to=sid)
        return

    await sio.enter_room(sid, f'project:{project_id}')
    logger.info('User %s joined room project:%s', user_id, project_id)


@sio.on('leave:project')
async def leave_project(sid, project_id):
    await sio.leave_room(sid, f'project:{project_id}')


def _check_membership(user_id, project_id):
    from projects.models import Membership
    return Membership.objects.filter(user_id=user_id, project_id=project_id).exists()


def _schedule(coro):
    if _main_loop is None or not _main_loop.is_running():
        logger.warning('emit skipped: main event loop not ready')
        return
    asyncio.run_coroutine_threadsafe(coro, _main_loop)


def emit_to_project(project_id, event, data):
    _schedule(sio.emit(event, data, to=f'project:{project_id}'))


def emit_to_user(user_id, event, data):
    _schedule(sio.emit(event, data, to=f'user:{user_id}'))