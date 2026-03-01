import { describe, it, expect } from 'vitest';
import {
  MAZE_COLS, MAZE_ROWS, MAZE_CELL_SIZE,
  MAZE_OFFSET_X, MAZE_OFFSET_Y,
  GOAL_X, GOAL_Y,
  SPAWN_POSITIONS,
  WORLD_WIDTH, WORLD_HEIGHT,
  SPHERE_RADIUS, GOAL_RADIUS,
} from '@sphere-coop/shared';

describe('game constants – maze geometry', () => {
  it('MAZE_OFFSET_X centers the maze horizontally', () => {
    expect(MAZE_OFFSET_X).toBe(Math.round((WORLD_WIDTH - MAZE_COLS * MAZE_CELL_SIZE) / 2));
    expect(MAZE_OFFSET_X).toBe(32);
  });

  it('MAZE_OFFSET_Y centers the maze vertically', () => {
    expect(MAZE_OFFSET_Y).toBe(Math.round((WORLD_HEIGHT - MAZE_ROWS * MAZE_CELL_SIZE) / 2));
    expect(MAZE_OFFSET_Y).toBe(8);
  });

  it('GOAL_X is exactly 640 (center of world width)', () => {
    expect(GOAL_X).toBe(640);
  });

  it('GOAL_Y is exactly 360 (center of world height)', () => {
    expect(GOAL_Y).toBe(360);
  });

  it('GOAL_X falls in the center cell of the maze', () => {
    const centerCol = Math.floor(MAZE_COLS / 2);
    const cellLeft = MAZE_OFFSET_X + centerCol * MAZE_CELL_SIZE;
    const cellRight = cellLeft + MAZE_CELL_SIZE;
    expect(GOAL_X).toBeGreaterThan(cellLeft);
    expect(GOAL_X).toBeLessThan(cellRight);
  });

  it('GOAL_Y falls in the center cell of the maze', () => {
    const centerRow = Math.floor(MAZE_ROWS / 2);
    const cellTop = MAZE_OFFSET_Y + centerRow * MAZE_CELL_SIZE;
    const cellBottom = cellTop + MAZE_CELL_SIZE;
    expect(GOAL_Y).toBeGreaterThan(cellTop);
    expect(GOAL_Y).toBeLessThan(cellBottom);
  });

  it('has exactly 4 spawn positions (one per corner)', () => {
    expect(SPAWN_POSITIONS).toHaveLength(4);
  });

  it('spawn positions are at the four maze corner cells', () => {
    const left  = MAZE_OFFSET_X + MAZE_CELL_SIZE / 2;
    const right = MAZE_OFFSET_X + (MAZE_COLS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;
    const top   = MAZE_OFFSET_Y + MAZE_CELL_SIZE / 2;
    const bot   = MAZE_OFFSET_Y + (MAZE_ROWS - 1) * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;

    expect(SPAWN_POSITIONS[0]).toEqual({ x: left,  y: top });
    expect(SPAWN_POSITIONS[1]).toEqual({ x: right, y: top });
    expect(SPAWN_POSITIONS[2]).toEqual({ x: left,  y: bot });
    expect(SPAWN_POSITIONS[3]).toEqual({ x: right, y: bot });
  });

  it('all spawn positions are strictly inside world bounds', () => {
    for (const pos of SPAWN_POSITIONS) {
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.x).toBeLessThan(WORLD_WIDTH);
      expect(pos.y).toBeGreaterThan(0);
      expect(pos.y).toBeLessThan(WORLD_HEIGHT);
    }
  });

  it('spawn positions are far enough from goal to not trigger an immediate win', () => {
    const threshold = SPHERE_RADIUS + GOAL_RADIUS;
    for (const pos of SPAWN_POSITIONS) {
      const dist = Math.sqrt((pos.x - GOAL_X) ** 2 + (pos.y - GOAL_Y) ** 2);
      expect(dist).toBeGreaterThan(threshold);
    }
  });

  it('no two spawn positions are identical', () => {
    const keys = SPAWN_POSITIONS.map(p => `${p.x},${p.y}`);
    expect(new Set(keys).size).toBe(4);
  });
});
