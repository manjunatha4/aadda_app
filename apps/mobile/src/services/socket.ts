import { io, Socket } from 'socket.io-client';
import { storage } from './storage';

declare const process: any;

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return window.location.origin;
  }
  return 'http://localhost:4000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = await storage.getItem('accessToken');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
