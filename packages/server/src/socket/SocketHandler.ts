import type { Server } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { EVENTS, PING_INTERVAL_MS } from '@sphere-coop/shared';
import { RoomManager } from '../rooms/RoomManager.js';
import type { GameLoop } from '../game/GameLoop.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type GameLoopMap = Map<string, GameLoop>;

export function setupSocketHandler(io: IO): void {
  const roomManager = new RoomManager();
  const gameLoops: GameLoopMap = new Map();

  // Broadcast pings every PING_INTERVAL_MS
  setInterval(() => {
    for (const [code, _] of gameLoops) {
      const room = roomManager.getRoom(code);
      if (!room) continue;
      io.to(code).emit(EVENTS.PLAYERS_PING, room.getPings());
    }
  }, PING_INTERVAL_MS);

  io.on('connection', (socket) => {
    socket.data.roomCode = null as unknown as string;
    socket.data.name = '';

    registerRoomHandlers(io, socket, roomManager, gameLoops);
    registerGameHandlers(io, socket, roomManager, gameLoops);
  });
}
