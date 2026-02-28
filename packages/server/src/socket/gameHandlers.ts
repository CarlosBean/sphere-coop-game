import type { Socket, Server } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { EVENTS } from '@sphere-coop/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { GameLoopMap } from './SocketHandler.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(
  io: IO,
  socket: Sock,
  roomManager: RoomManager,
  gameLoops: GameLoopMap,
): void {

  socket.on(EVENTS.PLAYER_INPUT, (input) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const loop = gameLoops.get(code);
    loop?.setInput(socket.id, input);
  });

  socket.on(EVENTS.PLAYER_PING, (ms: number) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = roomManager.getRoom(code);
    room?.updatePing(socket.id, ms);
  });

  // Respond to ping probe instantly (ack)
  socket.on(EVENTS.PING, (callback) => {
    callback();
  });
}
