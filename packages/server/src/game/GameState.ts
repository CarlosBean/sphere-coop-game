import type {
  GameState as IGameState, PlayerState, InputSnapshot, WallSegment, GameOverData,
} from '@sphere-coop/shared';
import { SPAWN_POSITIONS, GOAL_X, GOAL_Y, GOAL_RADIUS, SPHERE_RADIUS } from '@sphere-coop/shared';
import type { RoomPlayer } from '../rooms/Room.js';
import { generateMaze } from './MazeGenerator.js';
import {
  applyInput, stepPlayer,
  resolvePlayerWallCollisions, resolvePlayerPlayerCollision,
} from './Physics.js';

export class GameState {
  private state: IGameState;
  private inputs: Map<string, InputSnapshot> = new Map();
  private walls: WallSegment[];
  private startTime: number;

  constructor(players: RoomPlayer[]) {
    this.walls = generateMaze();
    this.startTime = Date.now();

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
    };
  }

  getWalls(): WallSegment[] {
    return this.walls;
  }

  setInput(socketId: string, input: InputSnapshot): void {
    this.inputs.set(socketId, input);
  }

  tick(): { state: IGameState; winner: GameOverData | null } {
    this.state.tick++;

    for (const player of this.state.players) {
      const input = this.inputs.get(player.id);
      if (input) applyInput(player, input);
      stepPlayer(player);
      resolvePlayerWallCollisions(player, this.walls);
    }

    // Player ↔ Player collisions
    const players = this.state.players;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        resolvePlayerPlayerCollision(players[i]!, players[j]!);
      }
    }

    const winner = this.checkWin();
    return { state: this.getSnapshot(), winner };
  }

  private checkWin(): GameOverData | null {
    for (const player of this.state.players) {
      const dx = player.x - GOAL_X;
      const dy = player.y - GOAL_Y;
      if (Math.sqrt(dx * dx + dy * dy) < SPHERE_RADIUS + GOAL_RADIUS) {
        return {
          winnerId: player.id,
          winnerName: player.name,
          timeMs: Date.now() - this.startTime,
        };
      }
    }
    return null;
  }

  /** Test-only: teleport a player to arbitrary coordinates for unit testing. */
  _teleportPlayerForTesting(socketId: string, x: number, y: number): void {
    const player = this.state.players.find(p => p.id === socketId);
    if (player) { player.x = x; player.y = y; }
  }

  getSnapshot(): IGameState {
    return {
      tick: this.state.tick,
      players: this.state.players.map(p => ({ ...p })),
      // Include walls on tick 1 so the client can build the MazeRenderer
      // once it is already inside GameScene and listening to stateUpdate.
      ...(this.state.tick === 1 ? { walls: this.walls } : {}),
    };
  }
}
