import type { InputSnapshot, GameState, WallSegment, GameOverData } from './game.types.js';
import type { RoomInfo } from './room.types.js';

export interface ClientToServerEvents {
  'room:create': (name: string) => void;
  'room:join': (data: { code: string; name: string }) => void;
  'room:leave': () => void;
  'game:start': () => void;
  'player:input': (input: InputSnapshot) => void;
  'player:ping': (ms: number) => void;
  ping: (callback: () => void) => void;
}

export interface ServerToClientEvents {
  'room:created': (info: RoomInfo) => void;
  'room:joined': (info: RoomInfo) => void;
  'room:error': (message: string) => void;
  'lobby:update': (info: RoomInfo) => void;
  'game:starting': (countdown: number) => void;
  'game:maze': (walls: WallSegment[]) => void;
  'game:stateUpdate': (state: GameState) => void;
  'game:over': (data: GameOverData | null) => void;
  'players:ping': (pings: Record<string, number>) => void;
}

export interface InterServerEvents {
  // empty
}

export interface SocketData {
  name: string;
  roomCode: string | null;
}
