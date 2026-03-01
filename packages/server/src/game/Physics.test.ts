import { describe, it, expect } from 'vitest';
import {
  applyInput,
  stepPlayer,
  resolvePlayerWallCollisions,
  resolvePlayerPlayerCollision,
} from './Physics.js';
import {
  SPHERE_RADIUS, PLAYER_SPEED, FRICTION, TICK_MS,
  WORLD_WIDTH, WORLD_HEIGHT,
} from '@sphere-coop/shared';
import type { PlayerState, WallSegment } from '@sphere-coop/shared';

const DT = TICK_MS / 1000; // 0.05 s

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { id: 'p1', name: 'Test', colorIndex: 0, x: 400, y: 300, vx: 0, vy: 0, ...overrides };
}

// ─── applyInput ───────────────────────────────────────────────────────────────

describe('applyInput', () => {
  it('accelerates right when right key held', () => {
    const p = makePlayer();
    applyInput(p, { left: false, right: true, up: false, down: false });
    expect(p.vx).toBeCloseTo(PLAYER_SPEED * DT);
    expect(p.vy).toBe(0);
  });

  it('accelerates left when left key held', () => {
    const p = makePlayer();
    applyInput(p, { left: true, right: false, up: false, down: false });
    expect(p.vx).toBeCloseTo(-PLAYER_SPEED * DT);
    expect(p.vy).toBe(0);
  });

  it('accelerates up when up key held', () => {
    const p = makePlayer();
    applyInput(p, { left: false, right: false, up: true, down: false });
    expect(p.vy).toBeCloseTo(-PLAYER_SPEED * DT);
    expect(p.vx).toBe(0);
  });

  it('accelerates down when down key held', () => {
    const p = makePlayer();
    applyInput(p, { left: false, right: false, up: false, down: true });
    expect(p.vy).toBeCloseTo(PLAYER_SPEED * DT);
    expect(p.vx).toBe(0);
  });

  it('normalizes diagonal so magnitude equals PLAYER_SPEED * DT', () => {
    const p = makePlayer();
    applyInput(p, { left: false, right: true, up: false, down: true });
    const magnitude = Math.sqrt(p.vx ** 2 + p.vy ** 2);
    expect(magnitude).toBeCloseTo(PLAYER_SPEED * DT);
  });

  it('does nothing when no keys are pressed', () => {
    const p = makePlayer({ vx: 5, vy: 3 });
    applyInput(p, { left: false, right: false, up: false, down: false });
    expect(p.vx).toBe(5);
    expect(p.vy).toBe(3);
  });

  it('cancels x-axis impulse when left and right pressed simultaneously', () => {
    const p = makePlayer();
    applyInput(p, { left: true, right: true, up: false, down: false });
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });

  it('cancels y-axis impulse when up and down pressed simultaneously', () => {
    const p = makePlayer();
    applyInput(p, { left: false, right: false, up: true, down: true });
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });
});

// ─── stepPlayer ───────────────────────────────────────────────────────────────

describe('stepPlayer', () => {
  it('applies friction to vx and vy', () => {
    const p = makePlayer({ vx: 100, vy: 50 });
    stepPlayer(p);
    expect(p.vx).toBeCloseTo(100 * FRICTION);
    expect(p.vy).toBeCloseTo(50 * FRICTION);
  });

  it('moves position by friction-damped velocity × DT', () => {
    const p = makePlayer({ x: 400, y: 300, vx: 200, vy: 0 });
    stepPlayer(p);
    expect(p.x).toBeCloseTo(400 + 200 * FRICTION * DT);
  });

  it('decelerates to near-zero from a non-zero velocity over many ticks', () => {
    const p = makePlayer({ vx: 100, vy: 100 });
    for (let i = 0; i < 100; i++) stepPlayer(p);
    expect(Math.abs(p.vx)).toBeLessThan(0.001);
    expect(Math.abs(p.vy)).toBeLessThan(0.001);
  });

  it('clamps x to left world boundary', () => {
    const p = makePlayer({ x: 5, vx: -1000 });
    stepPlayer(p);
    expect(p.x).toBeGreaterThanOrEqual(SPHERE_RADIUS);
  });

  it('clamps x to right world boundary', () => {
    const p = makePlayer({ x: WORLD_WIDTH - 5, vx: 1000 });
    stepPlayer(p);
    expect(p.x).toBeLessThanOrEqual(WORLD_WIDTH - SPHERE_RADIUS);
  });

  it('clamps y to top world boundary', () => {
    const p = makePlayer({ y: 5, vy: -1000 });
    stepPlayer(p);
    expect(p.y).toBeGreaterThanOrEqual(SPHERE_RADIUS);
  });

  it('clamps y to bottom world boundary', () => {
    const p = makePlayer({ y: WORLD_HEIGHT - 5, vy: 1000 });
    stepPlayer(p);
    expect(p.y).toBeLessThanOrEqual(WORLD_HEIGHT - SPHERE_RADIUS);
  });
});

// ─── resolvePlayerWallCollisions ─────────────────────────────────────────────

describe('resolvePlayerWallCollisions', () => {
  // Horizontal wall at y=200, spanning x=[0,500]
  const hWall: WallSegment = { x1: 0, y1: 200, x2: 500, y2: 200 };

  it('pushes player outside the wall radius', () => {
    // Player at y=205, overlapping wall above (distance=5 < SPHERE_RADIUS=10)
    const p = makePlayer({ x: 250, y: 205 });
    resolvePlayerWallCollisions(p, [hWall]);
    // Player should be at y ≥ 200 + SPHERE_RADIUS
    expect(p.y).toBeGreaterThanOrEqual(200 + SPHERE_RADIUS - 0.001);
  });

  it('does not move a player that is already outside collision range', () => {
    const p = makePlayer({ x: 250, y: 300 }); // 100 units below wall – safe
    const { x: ox, y: oy } = p;
    resolvePlayerWallCollisions(p, [hWall]);
    expect(p.x).toBe(ox);
    expect(p.y).toBe(oy);
  });

  it('cancels velocity component pointing into the wall', () => {
    // Player moving upward (vy < 0) into the wall from below
    const p = makePlayer({ x: 250, y: 205, vy: -50 });
    resolvePlayerWallCollisions(p, [hWall]);
    // Normal points down (away from wall), vy dot normal was negative → cancelled
    expect(p.vy).toBeGreaterThanOrEqual(0);
  });

  it('preserves velocity component parallel to the wall', () => {
    const p = makePlayer({ x: 250, y: 205, vx: 30, vy: -50 });
    resolvePlayerWallCollisions(p, [hWall]);
    expect(p.vx).toBeCloseTo(30); // tangential velocity unchanged
  });

  it('handles a vertical wall (x=300)', () => {
    const vWall: WallSegment = { x1: 300, y1: 0, x2: 300, y2: 500 };
    // Player at x=294, overlapping the wall to the left (distance=6 < 10)
    const p = makePlayer({ x: 294, y: 200, vx: 50 });
    resolvePlayerWallCollisions(p, [vWall]);
    expect(p.x).toBeLessThanOrEqual(300 - SPHERE_RADIUS + 0.001);
  });

  it('no effect when player does not overlap any wall in the list', () => {
    const farWall: WallSegment = { x1: 0, y1: 600, x2: 500, y2: 600 };
    const p = makePlayer({ x: 250, y: 300, vx: 10, vy: 20 });
    resolvePlayerWallCollisions(p, [farWall]);
    expect(p.x).toBe(250);
    expect(p.y).toBe(300);
    expect(p.vx).toBe(10);
    expect(p.vy).toBe(20);
  });
});

// ─── resolvePlayerPlayerCollision ────────────────────────────────────────────

describe('resolvePlayerPlayerCollision', () => {
  it('separates overlapping players to exactly 2×SPHERE_RADIUS apart', () => {
    // Players 10 px apart (overlap = 10, minDist = 20)
    const a = makePlayer({ id: 'a', x: 100, y: 100 });
    const b = makePlayer({ id: 'b', x: 110, y: 100 });
    resolvePlayerPlayerCollision(a, b);
    const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    expect(dist).toBeCloseTo(SPHERE_RADIUS * 2);
  });

  it('pushes both players equally (symmetric separation)', () => {
    const a = makePlayer({ id: 'a', x: 100, y: 100 });
    const b = makePlayer({ id: 'b', x: 110, y: 100 });
    const origAx = a.x, origBx = b.x;
    resolvePlayerPlayerCollision(a, b);
    expect(Math.abs(a.x - origAx)).toBeCloseTo(Math.abs(b.x - origBx));
  });

  it('does not modify non-overlapping players', () => {
    const a = makePlayer({ id: 'a', x: 100, y: 100 });
    const b = makePlayer({ id: 'b', x: 200, y: 100 }); // 100 px apart > minDist 20
    const snap = { ax: a.x, ay: a.y, bx: b.x, by: b.y };
    resolvePlayerPlayerCollision(a, b);
    expect(a.x).toBe(snap.ax);
    expect(a.y).toBe(snap.ay);
    expect(b.x).toBe(snap.bx);
    expect(b.y).toBe(snap.by);
  });

  it('does not produce NaN when players are at the same position (zero-distance guard)', () => {
    const a = makePlayer({ id: 'a', x: 100, y: 100 });
    const b = makePlayer({ id: 'b', x: 100, y: 100 });
    resolvePlayerPlayerCollision(a, b);
    expect(isNaN(a.x)).toBe(false);
    expect(isNaN(a.y)).toBe(false);
    expect(isNaN(b.x)).toBe(false);
    expect(isNaN(b.y)).toBe(false);
  });

  it('separation is along the axis joining the two players', () => {
    // Vertical overlap: players share x, differ in y
    const a = makePlayer({ id: 'a', x: 200, y: 100 });
    const b = makePlayer({ id: 'b', x: 200, y: 110 });
    resolvePlayerPlayerCollision(a, b);
    // x coordinates should remain equal (separation is purely vertical)
    expect(a.x).toBeCloseTo(200);
    expect(b.x).toBeCloseTo(200);
    expect(b.y).toBeGreaterThan(a.y);
  });
});
