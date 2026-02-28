import Phaser from 'phaser';
import { EVENTS, PLAYER_COLORS, PLAYER_COLOR_NAMES } from '@sphere-coop/shared';
import type { RoomInfo, LobbyPlayer } from '@sphere-coop/shared';
import { getSocket } from '../network/SocketManager.js';

interface LobbyData {
  roomInfo: RoomInfo;
  isHost: boolean;
}

export class LobbyScene extends Phaser.Scene {
  private roomInfo!: RoomInfo;
  private isHost!: boolean;
  private playerListTexts: Phaser.GameObjects.Text[] = [];
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super('LobbyScene'); }

  init(data: LobbyData): void {
    this.roomInfo = data.roomInfo;
    this.isHost = data.isHost;
  }

  create(): void {
    const socket = getSocket();
    const cx = this.scale.width / 2;

    this.add.text(cx, 60, 'LOBBY', { fontSize: '36px', color: '#ffffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);

    // Room code
    this.add.text(cx, 120, 'Room Code:', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);
    this.add.text(cx, 158, this.roomInfo.code, { fontSize: '40px', color: '#ffcc00', stroke: '#000', strokeThickness: 3, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 195, '(share this with friends)', { fontSize: '14px', color: '#888888' }).setOrigin(0.5);

    this.add.text(cx, 250, 'Players:', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

    this.statusText = this.add.text(cx, 580, '', { fontSize: '24px', color: '#44ff88', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

    this.renderPlayers(this.roomInfo.players);

    // Start button (host only)
    if (this.isHost) {
      const startBtn = this.add.text(cx, 540, '[ START GAME ]', {
        fontSize: '28px', color: '#44ff88', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      startBtn.on('pointerover', () => startBtn.setColor('#88ffaa'));
      startBtn.on('pointerout', () => startBtn.setColor('#44ff88'));
      startBtn.on('pointerdown', () => {
        socket.emit(EVENTS.GAME_START);
        startBtn.setInteractive(false);
        startBtn.setColor('#555555');
      });
    } else {
      this.add.text(cx, 540, 'Waiting for host to start...', { fontSize: '18px', color: '#888888' }).setOrigin(0.5);
    }

    // Back button
    const backBtn = this.add.text(30, 30, '← Back', { fontSize: '16px', color: '#888888' })
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      socket.emit(EVENTS.ROOM_LEAVE);
      socket.off(EVENTS.LOBBY_UPDATE);
      socket.off(EVENTS.GAME_STARTING);
      this.scene.start('MenuScene');
    });

    // Lobby updates
    socket.on(EVENTS.LOBBY_UPDATE, (info: RoomInfo) => {
      this.roomInfo = info;
      this.renderPlayers(info.players);
    });

    // Countdown
    socket.on(EVENTS.GAME_STARTING, (countdown: number) => {
      if (countdown > 0) {
        this.statusText.setText(`Starting in ${countdown}...`);
      } else {
        socket.off(EVENTS.LOBBY_UPDATE);
        socket.off(EVENTS.GAME_STARTING);
        this.scene.start('GameScene', { roomInfo: this.roomInfo });
      }
    });
  }

  private renderPlayers(players: LobbyPlayer[]): void {
    this.playerListTexts.forEach(t => t.destroy());
    this.playerListTexts = [];

    const cx = this.scale.width / 2;
    players.forEach((p, i) => {
      const colorHex = '#' + (PLAYER_COLORS[p.colorIndex] ?? 0xffffff).toString(16).padStart(6, '0');
      const hostTag = p.isHost ? ' [HOST]' : '';
      const text = this.add.text(cx, 290 + i * 40, `${PLAYER_COLOR_NAMES[p.colorIndex]}: ${p.name}${hostTag}`, {
        fontSize: '20px',
        color: colorHex,
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.playerListTexts.push(text);
    });
  }
}
