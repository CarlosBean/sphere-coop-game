import {
  PLAYER_SPEED, FRICTION, TICK_MS,
  SPHERE_RADIUS,
  WORLD_WIDTH, WORLD_HEIGHT,
} from '@sphere-coop/shared';
import type { PlayerState, WallSegment, InputSnapshot } from '@sphere-coop/shared';

const DT = TICK_MS / 1000; // seconds per tick

export function applyInput(player: PlayerState, input: InputSnapshot): void {
  let ax = 0, ay = 0;
  if (input.left)  ax -= 1;
  if (input.right) ax += 1;
  if (input.up)    ay -= 1;
  if (input.down)  ay += 1;

  // Normalize diagonal
  const len = Math.sqrt(ax * ax + ay * ay);
  if (len > 0) { ax /= len; ay /= len; }

  player.vx += ax * PLAYER_SPEED * DT;
  player.vy += ay * PLAYER_SPEED * DT;
}

export function stepPlayer(player: PlayerState): void {
  player.vx *= FRICTION;
  player.vy *= FRICTION;
  player.x += player.vx * DT;
  player.y += player.vy * DT;

  // World boundary clamp (fallback)
  player.x = Math.max(SPHERE_RADIUS, Math.min(WORLD_WIDTH  - SPHERE_RADIUS, player.x));
  player.y = Math.max(SPHERE_RADIUS, Math.min(WORLD_HEIGHT - SPHERE_RADIUS, player.y));
}

// ─── Wall collision ────────────────────────────────────────────────────────────

function closestPointOnSegment(
  px: number, py: number,
  x1: number, y1: number, x2: number, y2: number,
): { x: number; y: number } {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: x1, y: y1 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

export function resolvePlayerWallCollisions(player: PlayerState, walls: WallSegment[]): void {
  for (const wall of walls) {
    const closest = closestPointOnSegment(player.x, player.y, wall.x1, wall.y1, wall.x2, wall.y2);
    const dx = player.x - closest.x;
    const dy = player.y - closest.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < SPHERE_RADIUS * SPHERE_RADIUS && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Push player outside the wall
      player.x = closest.x + nx * SPHERE_RADIUS;
      player.y = closest.y + ny * SPHERE_RADIUS;

      // Cancel velocity component pointing into the wall
      const dot = player.vx * nx + player.vy * ny;
      if (dot < 0) {
        player.vx -= dot * nx;
        player.vy -= dot * ny;
      }
    }
  }
}

export function resolvePlayerPlayerCollision(a: PlayerState, b: PlayerState): void {
  const minDist = SPHERE_RADIUS * 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= minDist || dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;
}
