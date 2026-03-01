import Phaser from 'phaser';
import { GOAL_X, GOAL_Y, GOAL_RADIUS } from '@sphere-coop/shared';
import type { WallSegment } from '@sphere-coop/shared';

const WALL_COLOR    = 0x4488cc;
const WALL_WIDTH    = 3;
const GOAL_COLOR    = 0xffd700;
const GOAL_PULSE_MS = 800;

export class MazeRenderer {
  private walls: Phaser.GameObjects.Graphics;
  private goal: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, segments: WallSegment[]) {
    // Walls
    this.walls = scene.add.graphics();
    this.walls.lineStyle(WALL_WIDTH, WALL_COLOR, 1);
    for (const seg of segments) {
      this.walls.moveTo(seg.x1, seg.y1);
      this.walls.lineTo(seg.x2, seg.y2);
    }
    this.walls.strokePath();

    // Goal circle — pulsing gold star
    this.goal = scene.add.graphics();
    this.drawGoal(1);

    scene.tweens.add({
      targets: this.goal,
      alpha: 0.4,
      duration: GOAL_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawGoal(alpha: number): void {
    this.goal.clear();
    this.goal.fillStyle(GOAL_COLOR, alpha);
    this.goal.fillCircle(GOAL_X, GOAL_Y, GOAL_RADIUS);
    this.goal.lineStyle(2, 0xffffff, 1);
    this.goal.strokeCircle(GOAL_X, GOAL_Y, GOAL_RADIUS);
  }

  destroy(): void {
    this.walls.destroy();
    this.goal.destroy();
  }
}
