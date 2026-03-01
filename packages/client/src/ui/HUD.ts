import Phaser from 'phaser';
import { PLAYER_COLOR_NAMES } from '@sphere-coop/shared';
import type { LobbyPlayer } from '@sphere-coop/shared';
import type { PingManager } from '../network/PingManager.js';

const PING_GREEN  = '#44ff88';
const PING_YELLOW = '#ffcc00';
const PING_RED    = '#ff4444';

function pingColor(ms: number): string {
  if (ms < 50)  return PING_GREEN;
  if (ms < 100) return PING_YELLOW;
  return PING_RED;
}

export class HUD {
  private pingManager: PingManager;
  private items: Map<string, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();
  private timerBg: Phaser.GameObjects.Rectangle;
  private timerText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, pingManager: PingManager, players: LobbyPlayer[]) {
    this.pingManager = pingManager;

    players.forEach((p, i) => {
      const y = 12 + i * 28;
      const bg = scene.add.rectangle(8, y, 190, 24, 0x000000, 0.5)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(10);
      const text = scene.add.text(14, y + 4, this.buildLabel(p, 0), {
        fontSize: '13px',
        color: '#ffffff',
      }).setScrollFactor(0).setDepth(11);
      this.items.set(p.id, { bg, text });
    });

    // Timer — top-right corner
    this.timerBg = scene.add.rectangle(scene.scale.width - 8, 12, 120, 28, 0x000000, 0.5)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(10);
    this.timerText = scene.add.text(scene.scale.width - 14, 16, '0.0s', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11);
  }

  update(players: LobbyPlayer[], elapsedMs: number): void {
    players.forEach(p => {
      const item = this.items.get(p.id);
      if (!item) return;
      const ms = this.pingManager.getPing(p.id);
      item.text.setText(this.buildLabel(p, ms));
      item.text.setColor(pingColor(ms));
    });

    this.timerText.setText(`${(elapsedMs / 1000).toFixed(1)}s`);
  }

  private buildLabel(p: LobbyPlayer, ms: number): string {
    const colorName = PLAYER_COLOR_NAMES[p.colorIndex] ?? '?';
    const pingStr = ms > 0 ? `${ms}ms` : '---';
    return `[${colorName}] ${p.name}  ${pingStr}`;
  }

  destroy(): void {
    this.items.forEach(({ bg, text }) => { bg.destroy(); text.destroy(); });
    this.items.clear();
    this.timerBg.destroy();
    this.timerText.destroy();
  }
}
