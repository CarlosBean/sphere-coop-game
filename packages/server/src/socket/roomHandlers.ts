import type { Socket, Server } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { EVENTS } from '@sphere-coop/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { GameLoopMap } from './SocketHandler.js';
import { GameLoop } from '../game/GameLoop.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerRoomHandlers(
  io: IO,
  socket: Sock,
  roomManager: RoomManager,
  gameLoops: GameLoopMap,
): void {

  socket.on(EVENTS.ROOM_CREATE, (name: string) => {
    // Leave any existing room
    leaveCurrentRoom(io, socket, roomManager, gameLoops);

    const room = roomManager.createRoom();
    const player = room.addPlayer(socket.id, name);
    if (!player) {
      socket.emit(EVENTS.ROOM_ERROR, 'Failed to create room');
      return;
    }

    socket.data.name = name;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    socket.emit(EVENTS.ROOM_CREATED, room.toRoomInfo());
  });

  socket.on(EVENTS.ROOM_JOIN, ({ code, name }: { code: string; name: string }) => {
    const room = roomManager.getRoom(code.toUpperCase());
    if (!room) { socket.emit(EVENTS.ROOM_ERROR, 'Room not found'); return; }
    if (room.isFull()) { socket.emit(EVENTS.ROOM_ERROR, 'Room is full'); return; }
    if (room.inGame) { socket.emit(EVENTS.ROOM_ERROR, 'Game already in progress'); return; }

    leaveCurrentRoom(io, socket, roomManager, gameLoops);

    const player = room.addPlayer(socket.id, name);
    if (!player) { socket.emit(EVENTS.ROOM_ERROR, 'Could not join room'); return; }

    socket.data.name = name;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    socket.emit(EVENTS.ROOM_JOINED, room.toRoomInfo());
    io.to(room.code).emit(EVENTS.LOBBY_UPDATE, room.toRoomInfo());
  });

  socket.on(EVENTS.ROOM_LEAVE, () => {
    leaveCurrentRoom(io, socket, roomManager, gameLoops);
  });

  socket.on(EVENTS.GAME_START, () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = roomManager.getRoom(code);
    if (!room || !room.isHost(socket.id)) return;
    if (room.size < 1) return;

    room.inGame = true;

    // Countdown 3-2-1
    let count = 3;
    io.to(room.code).emit(EVENTS.GAME_STARTING, count);
    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        io.to(room.code).emit(EVENTS.GAME_STARTING, count);
      } else {
        clearInterval(countInterval);
        const loop = new GameLoop(io, room, () => {
          room.inGame = false;
          gameLoops.delete(room.code);
        });
        gameLoops.set(room.code, loop);
        loop.start();
        io.to(room.code).emit(EVENTS.GAME_STARTING, 0);
      }
    }, 1000);
  });

  socket.on('disconnect', () => {
    leaveCurrentRoom(io, socket, roomManager, gameLoops);
  });
}

function leaveCurrentRoom(
  io: IO,
  socket: Sock,
  roomManager: RoomManager,
  gameLoops: GameLoopMap,
): void {
  const code = socket.data.roomCode;
  if (!code) return;

  const room = roomManager.getRoom(code);
  if (room) {
    room.removePlayer(socket.id);
    socket.leave(code);
    if (room.isEmpty()) {
      gameLoops.get(code)?.stop();
      gameLoops.delete(code);
      roomManager.deleteRoom(code);
    } else {
      io.to(code).emit(EVENTS.LOBBY_UPDATE, room.toRoomInfo());
    }
  }
  socket.data.roomCode = null as unknown as string;
}
