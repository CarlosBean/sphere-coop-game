import {
  PLAYER_SPEED, FRICTION, TICK_MS,
  SPHERE_RADIUS, BALL_RADIUS,
  WORLD_WIDTH, WORLD_HEIGHT,
} from '@sphere-coop/shared';
import type { PlayerState, BallState, InputSnapshot } from '@sphere-coop/shared';

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

  // Wall clamp
  player.x = Math.max(SPHERE_RADIUS, Math.min(WORLD_WIDTH  - SPHERE_RADIUS, player.x));
  player.y = Math.max(SPHERE_RADIUS, Math.min(WORLD_HEIGHT - SPHERE_RADIUS, player.y));
}

export function stepBall(ball: BallState): void {
  ball.vx *= FRICTION;
  ball.vy *= FRICTION;
  ball.x += ball.vx * DT;
  ball.y += ball.vy * DT;

  // Wall bounce
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + BALL_RADIUS > WORLD_WIDTH) {
    ball.x = WORLD_WIDTH - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + BALL_RADIUS > WORLD_HEIGHT) {
    ball.y = WORLD_HEIGHT - BALL_RADIUS;
    ball.vy = -Math.abs(ball.vy);
  }
}

export function resolvePlayerBallCollision(player: PlayerState, ball: BallState): void {
  const minDist = SPHERE_RADIUS + BALL_RADIUS;
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= minDist || dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;

  // Separate
  const overlap = minDist - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  // Transfer velocity impulse
  const relVx = player.vx - ball.vx;
  const relVy = player.vy - ball.vy;
  const impulse = relVx * nx + relVy * ny;
  if (impulse > 0) {
    ball.vx += impulse * nx;
    ball.vy += impulse * ny;
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
