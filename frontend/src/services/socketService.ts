import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get or create the singleton socket connection.
 * Uses the current page hostname so it works on LAN (192.168.x.x) automatically.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const backendPort = '5004';
    // Use same hostname as the browser so LAN access works automatically
    const baseUrl = `http://${window.location.hostname}:${backendPort}`;
    
    socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }
  return socket;
};

/**
 * Disconnect and destroy the socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
