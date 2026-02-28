import type { Server } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { TICK_MS, EVENTS } from '@sphere-coop/shared';
import { GameState } from './GameState.js';
import type { Room } from '../rooms/Room.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class GameLoop {
  private io: IO;
  private room: Room;
  private gameState: GameState;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(io: IO, room: Room) {
    this.io = io;
    this.room = room;
    this.gameState = new GameState(room.getAllPlayers());
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.step(), TICK_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setInput(socketId: string, input: Parameters<GameState['setInput']>[1]): void {
    this.gameState.setInput(socketId, input);
  }

  private step(): void {
    const state = this.gameState.tick();
    this.io.to(this.room.code).emit(EVENTS.GAME_STATE_UPDATE, state);
  }
}
