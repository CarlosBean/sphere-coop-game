import type { Server } from 'socket.io';
import type {
  GameState as IGameState, PlayerState, InputSnapshot,
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { SPAWN_POSITIONS, BALL_SPAWN, EVENTS } from '@sphere-coop/shared';
import type { RoomPlayer } from '../rooms/Room.js';
import {
  applyInput, stepPlayer, stepBall,
  resolvePlayerBallCollision, resolvePlayerPlayerCollision,
} from './Physics.js';

export class GameState {
  private state: IGameState;
  private inputs: Map<string, InputSnapshot> = new Map();

  constructor(players: RoomPlayer[]) {
    this.state = {
      tick: 0,
      players: players.map((p, i) => ({
        id: p.socketId,
        name: p.name,
        colorIndex: p.colorIndex,
        x: SPAWN_POSITIONS[i]?.x ?? 100,
        y: SPAWN_POSITIONS[i]?.y ?? 100,
        vx: 0,
        vy: 0,
      })),
      ball: { x: BALL_SPAWN.x, y: BALL_SPAWN.y, vx: 0, vy: 0 },
    };
  }

  setInput(socketId: string, input: InputSnapshot): void {
    this.inputs.set(socketId, input);
  }

  tick(): IGameState {
    this.state.tick++;

    for (const player of this.state.players) {
      const input = this.inputs.get(player.id);
      if (input) applyInput(player, input);
      stepPlayer(player);
    }

    stepBall(this.state.ball);

    // Player ↔ Ball collisions
    for (const player of this.state.players) {
      resolvePlayerBallCollision(player, this.state.ball);
    }

    // Player ↔ Player collisions
    const players = this.state.players;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        resolvePlayerPlayerCollision(players[i], players[j]);
      }
    }

    return this.getSnapshot();
  }

  getSnapshot(): IGameState {
    return {
      tick: this.state.tick,
      players: this.state.players.map(p => ({ ...p })),
      ball: { ...this.state.ball },
    };
  }
}
