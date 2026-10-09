import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Prioritize WebSocket over HTTP polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});