import Phaser from 'phaser';
import { PLAYER_COLORS, PLAYER_COLOR_NAMES } from '@sphere-coop/shared';
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
  private scene: Phaser.Scene;
  private pingManager: PingManager;
  private items: Map<string, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();

  constructor(scene: Phaser.Scene, pingManager: PingManager, players: LobbyPlayer[]) {
    this.scene = scene;
    this.pingManager = pingManager;

    players.forEach((p, i) => {
      const y = 12 + i * 28;
      const bg = scene.add.rectangle(8, y, 180, 24, 0x000000, 0.5).setOrigin(0, 0).setScrollFactor(0).setDepth(10);
      const text = scene.add.text(14, y + 4, this.buildLabel(p, 0), {
        fontSize: '13px',
        color: '#ffffff',
      }).setScrollFactor(0).setDepth(11);

      this.items.set(p.id, { bg, text });
    });
  }

  update(players: LobbyPlayer[]): void {
    players.forEach(p => {
      const item = this.items.get(p.id);
      if (!item) return;
      const ms = this.pingManager.getPing(p.id);
      item.text.setText(this.buildLabel(p, ms));
      item.text.setColor(pingColor(ms));
    });
  }

  private buildLabel(p: LobbyPlayer, ms: number): string {
    const colorName = PLAYER_COLOR_NAMES[p.colorIndex] ?? '?';
    const pingStr = ms > 0 ? `${ms}ms` : '---';
    return `[${colorName}] ${p.name}  ${pingStr}`;
  }

  destroy(): void {
    this.items.forEach(({ bg, text }) => { bg.destroy(); text.destroy(); });
    this.items.clear();
  }
}
