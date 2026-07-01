import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },           // sent in handshake — verified by gateway
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,   // start with 1s, doubles each attempt
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // If server disconnected us (e.g. token expired), don't auto reconnect
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}