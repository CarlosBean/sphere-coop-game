import Phaser from 'phaser';
import { EVENTS, WORLD_WIDTH, WORLD_HEIGHT } from '@sphere-coop/shared';
import type { RoomInfo, GameState, LobbyPlayer } from '@sphere-coop/shared';
import { getSocket } from '../network/SocketManager.js';
import { PingManager } from '../network/PingManager.js';
import { InputHandler } from '../utils/InputHandler.js';
import { LocalPlayer } from '../entities/LocalPlayer.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { SharedBall } from '../entities/SharedBall.js';
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
  private ball: SharedBall | null = null;
  private hud: HUD | null = null;
  private lobbyPlayers: LobbyPlayer[] = [];

  constructor() { super('GameScene'); }

  init(data: GameSceneData): void {
    this.roomInfo = data.roomInfo;
  }

  create(): void {
    const socket = getSocket();
    const socketId = socket.id!;

    // Background grid
    this.drawBackground();

    // World bounds indicator
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT)
      .setStrokeStyle(2, 0x333333);

    this.pingManager = new PingManager();
    this.pingManager.start();

    this.inputHandler = new InputHandler();

    this.lobbyPlayers = this.roomInfo.players;

    // Socket listeners
    socket.on(EVENTS.GAME_STATE_UPDATE, (state: GameState) => {
      this.onStateUpdate(state, socketId);
    });

    socket.on(EVENTS.GAME_OVER, () => {
      this.cleanup(socket);
      this.scene.start('MenuScene');
    });

    // Camera follows local player
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  update(): void {
    const socket = getSocket();
    const input = this.inputHandler.getSnapshot();
    socket.emit(EVENTS.PLAYER_INPUT, input);

    // Interpolate remote entities
    this.remotePlayers.forEach(rp => rp.interpolate());
    this.ball?.interpolate();

    // HUD refresh
    if (this.hud) this.hud.update(this.lobbyPlayers);
  }

  private onStateUpdate(state: GameState, socketId: string): void {
    const myState = state.players.find(p => p.id === socketId);

    // Initialize entities on first update
    if (!this.ball && state.ball) {
      this.ball = new SharedBall(this, state.ball);
    }
    this.ball?.update(state.ball);

    for (const playerState of state.players) {
      if (playerState.id === socketId) {
        if (!this.localPlayer) {
          this.localPlayer = new LocalPlayer(this, playerState);
          // Camera follow the player's circle
          this.cameras.main.startFollow(this.localPlayer.circle, true, 0.1, 0.1);
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
      if (!activeIds.has(id)) {
        rp.destroy();
        this.remotePlayers.delete(id);
      }
    });

    // Init HUD once
    if (!this.hud) {
      this.hud = new HUD(this, this.pingManager, this.roomInfo.players);
    }
  }

  private drawBackground(): void {
    const gridSize = 80;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x222222, 1);
    for (let x = 0; x <= WORLD_WIDTH; x += gridSize) {
      graphics.moveTo(x, 0).lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += gridSize) {
      graphics.moveTo(0, y).lineTo(WORLD_WIDTH, y);
    }
    graphics.strokePath();
  }

  private cleanup(socket: ReturnType<typeof getSocket>): void {
    socket.off(EVENTS.GAME_STATE_UPDATE);
    socket.off(EVENTS.GAME_OVER);
    this.pingManager.stop();
    this.inputHandler.destroy();
    this.localPlayer?.destroy();
    this.remotePlayers.forEach(rp => rp.destroy());
    this.ball?.destroy();
    this.hud?.destroy();
  }

  shutdown(): void {
    const socket = getSocket();
    this.cleanup(socket);
  }
}
