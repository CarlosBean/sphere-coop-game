export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  name: string;
  colorIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  tick: number;
  players: PlayerState[];
  walls?: WallSegment[]; // only present on tick 1 — sent once to bootstrap the client
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GameOverData {
  winnerId: string;
  winnerName: string;
  timeMs: number;
}

export interface InputSnapshot {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  tick?: number;
}
