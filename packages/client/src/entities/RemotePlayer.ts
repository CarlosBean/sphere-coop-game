import Phaser from 'phaser';
import { SPHERE_RADIUS, PLAYER_COLORS } from '@sphere-coop/shared';
import type { PlayerState } from '@sphere-coop/shared';

export class RemotePlayer {
  private circle: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, state: PlayerState) {
    const color = PLAYER_COLORS[state.colorIndex] ?? 0xffffff;

    this.circle = scene.add.circle(state.x, state.y, SPHERE_RADIUS, color);
    this.circle.setStrokeStyle(2, 0xffffff, 0.5);

    this.label = scene.add.text(state.x, state.y - SPHERE_RADIUS - 14, state.name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1);

    this.targetX = state.x;
    this.targetY = state.y;
  }

  update(state: PlayerState): void {
    this.targetX = state.x;
    this.targetY = state.y;
  }

  /** Call each frame for smooth interpolation */
  interpolate(alpha = 0.2): void {
    this.circle.x = Phaser.Math.Linear(this.circle.x, this.targetX, alpha);
    this.circle.y = Phaser.Math.Linear(this.circle.y, this.targetY, alpha);
    this.label.x = this.circle.x;
    this.label.y = this.circle.y - SPHERE_RADIUS - 4;
  }

  destroy(): void {
    this.circle.destroy();
    this.label.destroy();
  }
}
