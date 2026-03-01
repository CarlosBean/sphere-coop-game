import {
  MAZE_COLS, MAZE_ROWS, MAZE_CELL_SIZE,
  MAZE_OFFSET_X, MAZE_OFFSET_Y,
} from '@sphere-coop/shared';
import type { WallSegment } from '@sphere-coop/shared';

type Dir = 'N' | 'S' | 'E' | 'W';

interface Cell {
  visited: boolean;
  N: boolean; S: boolean; E: boolean; W: boolean;
}

const DIRS: { dir: Dir; opp: Dir; dc: number; dr: number }[] = [
  { dir: 'N', opp: 'S', dc: 0,  dr: -1 },
  { dir: 'S', opp: 'N', dc: 0,  dr:  1 },
  { dir: 'W', opp: 'E', dc: -1, dr:  0 },
  { dir: 'E', opp: 'W', dc:  1, dr:  0 },
];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function generateMaze(): WallSegment[] {
  const cols = MAZE_COLS;
  const rows = MAZE_ROWS;

  // Grid with all walls present
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ visited: false, N: true, S: true, E: true, W: true }))
  );

  // Iterative randomized DFS (recursive backtracker)
  const stack: [number, number][] = [[0, 0]];
  grid[0]![0]!.visited = true;

  while (stack.length > 0) {
    const [col, row] = stack[stack.length - 1]!;
    const available = shuffle(
      DIRS.filter(({ dc, dr }) => {
        const nc = col + dc, nr = row + dr;
        return nc >= 0 && nc < cols && nr >= 0 && nr < rows && !grid[nr]![nc]!.visited;
      })
    );

    if (available.length === 0) {
      stack.pop();
    } else {
      const { dir, opp, dc, dr } = available[0]!;
      const nc = col + dc, nr = row + dr;
      grid[row]![col]![dir] = false;
      grid[nr]![nc]![opp] = false;
      grid[nr]![nc]!.visited = true;
      stack.push([nc, nr]);
    }
  }

  // Convert cell walls to line segments (each wall added exactly once)
  const ox = MAZE_OFFSET_X;
  const oy = MAZE_OFFSET_Y;
  const cs = MAZE_CELL_SIZE;
  const walls: WallSegment[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row]![col]!;
      const x = ox + col * cs;
      const y = oy + row * cs;
      // North wall of this cell (covers top boundary too)
      if (cell.N) walls.push({ x1: x, y1: y, x2: x + cs, y2: y });
      // West wall of this cell (covers left boundary too)
      if (cell.W) walls.push({ x1: x, y1: y, x2: x, y2: y + cs });
    }
  }

  // South boundary (bottom edge of last row)
  for (let col = 0; col < cols; col++) {
    if (grid[rows - 1]![col]!.S) {
      const x = ox + col * cs;
      const y = oy + rows * cs;
      walls.push({ x1: x, y1: y, x2: x + cs, y2: y });
    }
  }

  // East boundary (right edge of last column)
  for (let row = 0; row < rows; row++) {
    if (grid[row]![cols - 1]!.E) {
      const x = ox + cols * cs;
      const y = oy + row * cs;
      walls.push({ x1: x, y1: y, x2: x, y2: y + cs });
    }
  }

  return walls;
}
