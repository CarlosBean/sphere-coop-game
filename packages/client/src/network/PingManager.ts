import { EVENTS, PING_INTERVAL_MS } from '@sphere-coop/shared';
import { getSocket } from './SocketManager.js';

export class PingManager {
  private pings: Map<string, number> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    const socket = getSocket();

    // Self-measure RTT
    this.intervalId = setInterval(() => {
      const start = Date.now();
      socket.emit(EVENTS.PING, () => {
        const ms = Date.now() - start;
        socket.emit(EVENTS.PLAYER_PING, ms);
        this.pings.set(socket.id!, ms);
      });
    }, PING_INTERVAL_MS);

    // Receive all player pings from server
    socket.on(EVENTS.PLAYERS_PING, (pings: Record<string, number>) => {
      for (const [id, ms] of Object.entries(pings)) {
        this.pings.set(id, ms);
      }
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const socket = getSocket();
    socket.off(EVENTS.PLAYERS_PING);
  }

  getPing(socketId: string): number {
    return this.pings.get(socketId) ?? 0;
  }

  getAllPings(): Map<string, number> {
    return this.pings;
  }
}
