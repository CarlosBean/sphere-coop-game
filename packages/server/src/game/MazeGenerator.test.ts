import { describe, it, expect } from 'vitest';
import { generateMaze } from './MazeGenerator.js';
import {
  MAZE_COLS, MAZE_ROWS, MAZE_CELL_SIZE,
  MAZE_OFFSET_X, MAZE_OFFSET_Y,
} from '@sphere-coop/shared';
import type { WallSegment } from '@sphere-coop/shared';

describe('generateMaze', () => {
  it('returns a non-empty array of wall segments', () => {
    const walls = generateMaze();
    expect(Array.isArray(walls)).toBe(true);
    expect(walls.length).toBeGreaterThan(0);
  });

  it('every wall is axis-aligned (horizontal or vertical)', () => {
    const walls = generateMaze();
    for (const w of walls) {
      const isHorizontal = w.y1 === w.y2;
      const isVertical   = w.x1 === w.x2;
      expect(isHorizontal || isVertical).toBe(true);
    }
  });

  it('all wall coordinates lie within the maze bounding box', () => {
    const walls = generateMaze();
    const minX = MAZE_OFFSET_X;
    const maxX = MAZE_OFFSET_X + MAZE_COLS * MAZE_CELL_SIZE;
    const minY = MAZE_OFFSET_Y;
    const maxY = MAZE_OFFSET_Y + MAZE_ROWS * MAZE_CELL_SIZE;

    for (const w of walls) {
      expect(w.x1).toBeGreaterThanOrEqual(minX);
      expect(w.x2).toBeGreaterThanOrEqual(minX);
      expect(w.x1).toBeLessThanOrEqual(maxX);
      expect(w.x2).toBeLessThanOrEqual(maxX);
      expect(w.y1).toBeGreaterThanOrEqual(minY);
      expect(w.y2).toBeGreaterThanOrEqual(minY);
      expect(w.y1).toBeLessThanOrEqual(maxY);
      expect(w.y2).toBeLessThanOrEqual(maxY);
    }
  });

  it('outer border is fully enclosed – all 4 sides have a wall for every cell', () => {
    const walls = generateMaze();
    const cs  = MAZE_CELL_SIZE;
    const ox  = MAZE_OFFSET_X;
    const oy  = MAZE_OFFSET_Y;

    // Top border: COLS horizontal segments at y = oy
    const topY = oy;
    const topWalls = walls.filter(w => w.y1 === topY && w.y2 === topY);
    expect(topWalls.length).toBe(MAZE_COLS);

    // Bottom border: COLS horizontal segments at y = oy + ROWS*cs
    const botY = oy + MAZE_ROWS * cs;
    const botWalls = walls.filter(w => w.y1 === botY && w.y2 === botY);
    expect(botWalls.length).toBe(MAZE_COLS);

    // Left border: ROWS vertical segments at x = ox
    const leftWalls = walls.filter(w => w.x1 === ox && w.x2 === ox);
    expect(leftWalls.length).toBe(MAZE_ROWS);

    // Right border: ROWS vertical segments at x = ox + COLS*cs
    const rightX = ox + MAZE_COLS * cs;
    const rightWalls = walls.filter(w => w.x1 === rightX && w.x2 === rightX);
    expect(rightWalls.length).toBe(MAZE_ROWS);
  });

  it('generates a perfect maze – wall count matches spanning-tree formula', () => {
    // Perfect maze = minimum spanning tree over the cell grid.
    // Border segments (always present): 2*COLS + 2*ROWS
    // Interior segments possible: (COLS-1)*ROWS + COLS*(ROWS-1)
    // DFS removes exactly COLS*ROWS - 1 interior walls to connect all cells.
    // Total = border + (interior possible - (COLS*ROWS - 1))
    const cols = MAZE_COLS;
    const rows = MAZE_ROWS;
    const border          = 2 * cols + 2 * rows;
    const interiorPossible = (cols - 1) * rows + cols * (rows - 1);
    const interiorPresent  = interiorPossible - (cols * rows - 1);
    const expected         = border + interiorPresent;

    const walls = generateMaze();
    expect(walls.length).toBe(expected);
  });

  it('produces distinct mazes on repeated calls (RNG is live)', () => {
    // Running 3 independent mazes and checking that not all share the same
    // JSON fingerprint rules out a broken constant/memoised implementation.
    const fingerprint = (w: WallSegment[]) => JSON.stringify(w);
    const [a, b, c] = [generateMaze(), generateMaze(), generateMaze()].map(fingerprint);
    // In a 19×11 grid the probability of two identical mazes is astronomically small.
    const allSame = a === b && b === c;
    expect(allSame).toBe(false);
  });

  it('maze is fully connected – BFS from (0,0) reaches every cell', () => {
    const walls = generateMaze();
    const cs = MAZE_CELL_SIZE;
    const ox = MAZE_OFFSET_X;
    const oy = MAZE_OFFSET_Y;

    // Index walls by canonical key for O(1) lookup
    const wallSet = new Set(walls.map(w => `${w.x1},${w.y1},${w.x2},${w.y2}`));

    const hasWall = (x1: number, y1: number, x2: number, y2: number): boolean =>
      wallSet.has(`${x1},${y1},${x2},${y2}`) || wallSet.has(`${x2},${y2},${x1},${y1}`);

    const visited = new Set<string>();
    const queue: [number, number][] = [[0, 0]];
    visited.add('0,0');

    while (queue.length > 0) {
      const [col, row] = queue.shift()!;
      const x = ox + col * cs;
      const y = oy + row * cs;

      // North: absent N-wall of (col, row) → connected to (col, row-1)
      if (row > 0 && !hasWall(x, y, x + cs, y)) {
        const key = `${col},${row - 1}`;
        if (!visited.has(key)) { visited.add(key); queue.push([col, row - 1]); }
      }
      // South: absent N-wall of (col, row+1) → connected to (col, row+1)
      if (row < MAZE_ROWS - 1 && !hasWall(x, y + cs, x + cs, y + cs)) {
        const key = `${col},${row + 1}`;
        if (!visited.has(key)) { visited.add(key); queue.push([col, row + 1]); }
      }
      // West: absent W-wall of (col, row) → connected to (col-1, row)
      if (col > 0 && !hasWall(x, y, x, y + cs)) {
        const key = `${col - 1},${row}`;
        if (!visited.has(key)) { visited.add(key); queue.push([col - 1, row]); }
      }
      // East: absent W-wall of (col+1, row) → connected to (col+1, row)
      if (col < MAZE_COLS - 1 && !hasWall(x + cs, y, x + cs, y + cs)) {
        const key = `${col + 1},${row}`;
        if (!visited.has(key)) { visited.add(key); queue.push([col + 1, row]); }
      }
    }

    expect(visited.size).toBe(MAZE_COLS * MAZE_ROWS);
  });
});
