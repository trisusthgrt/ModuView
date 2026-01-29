import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(token?: string | null) {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

