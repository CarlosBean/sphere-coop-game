export const TICK_RATE = 20; // Hz
export const TICK_MS = 1000 / TICK_RATE; // 50ms per tick

export const MAX_PLAYERS = 4;

export const SPHERE_RADIUS = 24; // px
export const BALL_RADIUS = 18; // px

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const PLAYER_SPEED = 300; // px/s
export const FRICTION = 0.85;

export const PING_INTERVAL_MS = 2000;

/** ARGB hex colors: red, blue, green, yellow */
export const PLAYER_COLORS: number[] = [0xff4444, 0x44aaff, 0x44ff88, 0xffcc00];

export const PLAYER_COLOR_NAMES: string[] = ['Red', 'Blue', 'Green', 'Yellow'];

export const SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x: 80, y: 80 },
  { x: WORLD_WIDTH - 80, y: 80 },
  { x: 80, y: WORLD_HEIGHT - 80 },
  { x: WORLD_WIDTH - 80, y: WORLD_HEIGHT - 80 },
];

export const BALL_SPAWN = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
