import { MAX_PLAYERS, PLAYER_COLOR_NAMES } from '@sphere-coop/shared';
import type { LobbyPlayer, RoomInfo } from '@sphere-coop/shared';

export interface RoomPlayer extends LobbyPlayer {
  socketId: string;
  ping: number;
}

export class Room {
  readonly code: string;
  private players: Map<string, RoomPlayer> = new Map();
  private hostId: string | null = null;
  inGame = false;

  constructor(code: string) {
    this.code = code;
  }

  addPlayer(socketId: string, name: string): RoomPlayer | null {
    if (this.players.size >= MAX_PLAYERS) return null;

    // Assign next available color slot
    const usedSlots = new Set(Array.from(this.players.values()).map(p => p.colorIndex));
    let colorIndex = 0;
    for (let i = 0; i < MAX_PLAYERS; i++) {
      if (!usedSlots.has(i)) { colorIndex = i; break; }
    }

    const isFirst = this.players.size === 0;
    if (isFirst) this.hostId = socketId;

    const player: RoomPlayer = {
      id: socketId,
      socketId,
      name: name || `Player ${colorIndex + 1}`,
      colorIndex,
      isHost: isFirst,
      ping: 0,
    };

    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);

    // Transfer host if needed
    if (this.hostId === socketId && this.players.size > 0) {
      const next = this.players.values().next().value;
      if (next) {
        next.isHost = true;
        this.hostId = next.socketId;
      }
    }
  }

  updatePing(socketId: string, ms: number): void {
    const player = this.players.get(socketId);
    if (player) player.ping = ms;
  }

  getPings(): Record<string, number> {
    const result: Record<string, number> = {};
    this.players.forEach((p, id) => { result[id] = p.ping; });
    return result;
  }

  getPlayer(socketId: string): RoomPlayer | undefined {
    return this.players.get(socketId);
  }

  getAllPlayers(): RoomPlayer[] {
    return Array.from(this.players.values());
  }

  isHost(socketId: string): boolean {
    return this.hostId === socketId;
  }

  isFull(): boolean {
    return this.players.size >= MAX_PLAYERS;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  get size(): number {
    return this.players.size;
  }

  toRoomInfo(): RoomInfo {
    return {
      code: this.code,
      players: this.getAllPlayers().map(p => ({
        id: p.id,
        name: p.name,
        colorIndex: p.colorIndex,
        isHost: p.isHost,
      })),
      maxPlayers: MAX_PLAYERS,
      inGame: this.inGame,
    };
  }
}
