import Phaser from 'phaser';
import { BALL_RADIUS } from '@sphere-coop/shared';
import type { BallState } from '@sphere-coop/shared';

export class SharedBall {
  private circle: Phaser.GameObjects.Arc;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, state: BallState) {
    this.circle = scene.add.circle(state.x, state.y, BALL_RADIUS, 0xffffff);
    this.circle.setStrokeStyle(2, 0xaaaaaa);

    this.targetX = state.x;
    this.targetY = state.y;
  }

  update(state: BallState): void {
    this.targetX = state.x;
    this.targetY = state.y;
  }

  interpolate(alpha = 0.25): void {
    this.circle.x = Phaser.Math.Linear(this.circle.x, this.targetX, alpha);
    this.circle.y = Phaser.Math.Linear(this.circle.y, this.targetY, alpha);
  }

  destroy(): void {
    this.circle.destroy();
  }
}
