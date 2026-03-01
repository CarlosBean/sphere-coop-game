export const TICK_RATE = 20; // Hz
export const TICK_MS = 1000 / TICK_RATE; // 50ms per tick

export const MAX_PLAYERS = 4;

export const SPHERE_RADIUS = 10; // px — smaller for maze navigation

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const PLAYER_SPEED = 300; // px/s
export const FRICTION = 0.82;    // slightly snappier than 0.85

export const PING_INTERVAL_MS = 2000;

/** ARGB hex colors: red, blue, green, yellow */
export const PLAYER_COLORS: number[] = [0xff4444, 0x44aaff, 0x44ff88, 0xffcc00];
export const PLAYER_COLOR_NAMES: string[] = ['Red', 'Blue', 'Green', 'Yellow'];

// ─── Maze layout ─────────────────────────────────────────────────────────────
// 19 cols × 11 rows at 64 px/cell fills 1216 × 704 px, centered in the world.
export const MAZE_COLS = 19;
export const MAZE_ROWS = 11;
export const MAZE_CELL_SIZE = 64;
export const MAZE_OFFSET_X = Math.round((WORLD_WIDTH  - MAZE_COLS * MAZE_CELL_SIZE) / 2); // 32
export const MAZE_OFFSET_Y = Math.round((WORLD_HEIGHT - MAZE_ROWS * MAZE_CELL_SIZE) / 2); // 8

// Goal: center cell (9, 5) → pixel (640, 360)
export const GOAL_X = MAZE_OFFSET_X + Math.floor(MAZE_COLS / 2) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;
export const GOAL_Y = MAZE_OFFSET_Y + Math.floor(MAZE_ROWS / 2) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;
export const GOAL_RADIUS = 18; // px

// Players spawn at the four maze corner cells
export const SPAWN_POSITIONS: { x: number; y: number }[] = [
  { x: MAZE_OFFSET_X + MAZE_CELL_SIZE / 2,                                y: MAZE_OFFSET_Y + MAZE_CELL_SIZE / 2 },
  { x: MAZE_OFFSET_X + (MAZE_COLS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2, y: MAZE_OFFSET_Y + MAZE_CELL_SIZE / 2 },
  { x: MAZE_OFFSET_X + MAZE_CELL_SIZE / 2,                                y: MAZE_OFFSET_Y + (MAZE_ROWS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2 },
  { x: MAZE_OFFSET_X + (MAZE_COLS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2, y: MAZE_OFFSET_Y + (MAZE_ROWS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2 },
];
