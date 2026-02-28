import Phaser from 'phaser';
import { SPHERE_RADIUS, PLAYER_COLORS } from '@sphere-coop/shared';
import type { PlayerState } from '@sphere-coop/shared';

const CORRECTION_ALPHA = 0.3;

export class LocalPlayer {
  readonly circle: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;

  // Predicted position
  x: number;
  y: number;

  constructor(scene: Phaser.Scene, state: PlayerState) {
    const color = PLAYER_COLORS[state.colorIndex] ?? 0xffffff;

    this.x = state.x;
    this.y = state.y;

    this.circle = scene.add.circle(state.x, state.y, SPHERE_RADIUS, color);
    this.circle.setStrokeStyle(3, 0xffffff, 0.9);

    this.label = scene.add.text(state.x, state.y - SPHERE_RADIUS - 4, `${state.name} (you)`, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1);
  }

  /** Soft reconciliation: blend predicted pos toward server authoritative pos */
  reconcile(serverState: PlayerState): void {
    this.x = Phaser.Math.Linear(this.x, serverState.x, CORRECTION_ALPHA);
    this.y = Phaser.Math.Linear(this.y, serverState.y, CORRECTION_ALPHA);
    this.syncGraphics();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.syncGraphics();
  }

  private syncGraphics(): void {
    this.circle.x = this.x;
    this.circle.y = this.y;
    this.label.x = this.x;
    this.label.y = this.y - SPHERE_RADIUS - 4;
  }

  destroy(): void {
    this.circle.destroy();
    this.label.destroy();
  }
}
