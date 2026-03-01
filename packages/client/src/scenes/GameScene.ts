import Phaser from 'phaser';
import { EVENTS, WORLD_WIDTH, WORLD_HEIGHT } from '@sphere-coop/shared';
import type { RoomInfo, GameState, LobbyPlayer, GameOverData } from '@sphere-coop/shared';
import { getSocket } from '../network/SocketManager.js';
import { PingManager } from '../network/PingManager.js';
import { InputHandler } from '../utils/InputHandler.js';
import { LocalPlayer } from '../entities/LocalPlayer.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { MazeRenderer } from '../entities/MazeRenderer.js';
import { HUD } from '../ui/HUD.js';

interface GameSceneData {
  roomInfo: RoomInfo;
}

export class GameScene extends Phaser.Scene {
  private roomInfo!: RoomInfo;
  private pingManager!: PingManager;
  private inputHandler!: InputHandler;
  private localPlayer: LocalPlayer | null = null;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private mazeRenderer: MazeRenderer | null = null;
  private hud: HUD | null = null;
  private lobbyPlayers: LobbyPlayer[] = [];
  private gameOver = false;
  private startTime = 0;

  constructor() { super('GameScene'); }

  init(data: GameSceneData): void {
    this.roomInfo = data.roomInfo;
  }

  create(): void {
    const socket = getSocket();
    const socketId = socket.id!;

    this.startTime = Date.now();
    this.gameOver = false;

    // Dark background (maze will be drawn on top)
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x111111);

    this.pingManager = new PingManager();
    this.pingManager.start();

    this.inputHandler = new InputHandler();
    this.lobbyPlayers = this.roomInfo.players;

    socket.on(EVENTS.GAME_STATE_UPDATE, (state: GameState) => {
      if (!this.gameOver) this.onStateUpdate(state, socketId);
    });

    socket.on(EVENTS.GAME_OVER, (data: GameOverData | null) => {
      this.gameOver = true;
      this.inputHandler.destroy();
      this.showWinOverlay(data);
    });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  update(): void {
    if (this.gameOver) return;

    const socket = getSocket();
    const input = this.inputHandler.getSnapshot();
    socket.emit(EVENTS.PLAYER_INPUT, input);

    this.remotePlayers.forEach(rp => rp.interpolate());

    if (this.hud) this.hud.update(this.lobbyPlayers, Date.now() - this.startTime);
  }

  private onStateUpdate(state: GameState, socketId: string): void {
    // Walls arrive on tick 1 — build the renderer exactly once
    if (state.walls && !this.mazeRenderer) {
      this.mazeRenderer = new MazeRenderer(this, state.walls);
    }

    for (const playerState of state.players) {
      if (playerState.id === socketId) {
        if (!this.localPlayer) {
          this.localPlayer = new LocalPlayer(this, playerState);
        } else {
          this.localPlayer.reconcile(playerState);
        }
      } else {
        let rp = this.remotePlayers.get(playerState.id);
        if (!rp) {
          rp = new RemotePlayer(this, playerState);
          this.remotePlayers.set(playerState.id, rp);
        } else {
          rp.update(playerState);
        }
      }
    }

    // Remove disconnected players
    const activeIds = new Set(state.players.map(p => p.id));
    this.remotePlayers.forEach((rp, id) => {
      if (!activeIds.has(id)) { rp.destroy(); this.remotePlayers.delete(id); }
    });

    if (!this.hud) {
      this.hud = new HUD(this, this.pingManager, this.roomInfo.players);
    }
  }

  private showWinOverlay(data: GameOverData | null): void {
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;

    // Semi-transparent backdrop
    this.add.rectangle(cx, cy, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0.72)
      .setScrollFactor(0).setDepth(20);

    if (data) {
      const timeStr = (data.timeMs / 1000).toFixed(2);
      this.add.text(cx, cy - 50, `${data.winnerName} wins!`, {
        fontSize: '52px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 5,
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      this.add.text(cx, cy + 30, `Time: ${timeStr}s`, {
        fontSize: '34px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    } else {
      this.add.text(cx, cy, 'Game Over', {
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    }

    this.add.text(cx, cy + 100, 'Returning to menu in 5s...', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    this.time.delayedCall(5000, () => {
      const socket = getSocket();
      this.cleanup(socket);
      this.scene.start('MenuScene');
    });
  }

  private cleanup(socket: ReturnType<typeof getSocket>): void {
    socket.off(EVENTS.GAME_STATE_UPDATE);
    socket.off(EVENTS.GAME_OVER);
    this.pingManager.stop();
    this.localPlayer?.destroy();
    this.remotePlayers.forEach(rp => rp.destroy());
    this.mazeRenderer?.destroy();
    this.hud?.destroy();
  }

  shutdown(): void {
    this.cleanup(getSocket());
  }
}
