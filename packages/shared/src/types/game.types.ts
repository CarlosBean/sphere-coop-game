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

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  tick: number;
  players: PlayerState[];
  ball: BallState;
}

export interface InputSnapshot {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  tick?: number;
}
