import Phaser from 'phaser';
import { EVENTS, WORLD_WIDTH, WORLD_HEIGHT } from '@sphere-coop/shared';
import type { RoomInfo } from '@sphere-coop/shared';
import { connectSocket } from '../network/SocketManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    const socket = connectSocket();
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.text(cx, 80, 'SPHERE COOP', { fontSize: '48px', color: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(cx, 140, 'Up to 4 players — cooperative', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);

    // Name input
    this.add.text(cx, 220, 'Your Name:', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    const nameInput = this.createInput(cx, 260, 'Player');

    // Create room button
    const createBtn = this.add.text(cx, 310, '[ Create Room ]', { fontSize: '22px', color: '#44ff88', stroke: '#000', strokeThickness: 2 })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    createBtn.on('pointerover', () => createBtn.setColor('#88ffaa'));
    createBtn.on('pointerout', () => createBtn.setColor('#44ff88'));
    createBtn.on('pointerdown', () => {
      const name = nameInput.value || 'Player';
      socket.emit(EVENTS.ROOM_CREATE, name);
    });

    // Join room
    this.add.text(cx, 390, 'Room Code:', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    const codeInput = this.createInput(cx, 430, '');

    const joinBtn = this.add.text(cx, 490, '[ Join Room ]', { fontSize: '22px', color: '#44aaff', stroke: '#000', strokeThickness: 2 })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    joinBtn.on('pointerover', () => joinBtn.setColor('#88ccff'));
    joinBtn.on('pointerout', () => joinBtn.setColor('#44aaff'));
    joinBtn.on('pointerdown', () => {
      const name = nameInput.value || 'Player';
      const code = codeInput.value.toUpperCase();
      if (code.length < 1) { this.showError('Enter a room code'); return; }
      socket.emit(EVENTS.ROOM_JOIN, { code, name });
    });

    // Error text
    const errorText = this.add.text(cx, 560, '', { fontSize: '16px', color: '#ff4444' }).setOrigin(0.5);

    // Socket listeners
    socket.on(EVENTS.ROOM_CREATED, (info: RoomInfo) => {
      this.removeSocketListeners(socket);
      this.scene.start('LobbyScene', { roomInfo: info, isHost: true });
    });

    socket.on(EVENTS.ROOM_JOINED, (info: RoomInfo) => {
      this.removeSocketListeners(socket);
      this.scene.start('LobbyScene', { roomInfo: info, isHost: false });
    });

    socket.on(EVENTS.ROOM_ERROR, (msg: string) => {
      errorText.setText(msg);
      this.time.delayedCall(3000, () => errorText.setText(''));
    });
  }

  private showError(msg: string): void {
    // noop; error text shown via socket.on above
    console.warn(msg);
  }

  private createInput(x: number, y: number, placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.maxLength = 20;
    Object.assign(input.style, {
      position: 'absolute',
      width: '200px',
      padding: '6px 10px',
      fontSize: '16px',
      background: '#222',
      color: '#fff',
      border: '1px solid #555',
      borderRadius: '4px',
      outline: 'none',
    });

    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width  / canvas.width;
    const scaleY = rect.height / canvas.height;
    input.style.left = `${rect.left + x * scaleX - 100}px`;
    input.style.top  = `${rect.top  + y * scaleY - 16}px`;

    document.body.appendChild(input);

    // Remove on scene shutdown
    this.events.once('shutdown', () => input.remove());
    this.events.once('destroy', () => input.remove());

    return input;
  }

  private removeSocketListeners(socket: ReturnType<typeof connectSocket>): void {
    socket.off(EVENTS.ROOM_CREATED);
    socket.off(EVENTS.ROOM_JOINED);
    socket.off(EVENTS.ROOM_ERROR);
  }
}
