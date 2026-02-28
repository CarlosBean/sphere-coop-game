import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@sphere-coop/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let instance: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!instance) {
    instance = io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001', { autoConnect: false });
  }
  return instance;
}

export function connectSocket(): GameSocket {
  const socket = getSocket();
  if (!socket.connected) socket.connect();
  return socket;
}
