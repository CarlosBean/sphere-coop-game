import { describe, it, expect } from 'vitest';
import { Room } from './Room.js';
import { MAX_PLAYERS } from '@sphere-coop/shared';

describe('Room', () => {
  describe('addPlayer', () => {
    it('returns a RoomPlayer with the correct socketId and name', () => {
      const room = new Room('ABCD');
      const player = room.addPlayer('s1', 'Alice');
      expect(player).not.toBeNull();
      expect(player!.socketId).toBe('s1');
      expect(player!.name).toBe('Alice');
    });

    it('assigns the first player as host', () => {
      const room = new Room('ABCD');
      const p = room.addPlayer('s1', 'Alice');
      expect(p!.isHost).toBe(true);
    });

    it('subsequent players are not hosts', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      const p2 = room.addPlayer('s2', 'Bob');
      expect(p2!.isHost).toBe(false);
    });

    it('assigns unique colorIndex values to each player', () => {
      const room = new Room('ABCD');
      const colors = new Set<number>();
      for (let i = 0; i < MAX_PLAYERS; i++) {
        const p = room.addPlayer(`s${i}`, `P${i}`);
        colors.add(p!.colorIndex);
      }
      expect(colors.size).toBe(MAX_PLAYERS);
    });

    it('assigns colorIndex starting from 0', () => {
      const room = new Room('ABCD');
      const p = room.addPlayer('s1', 'Alice');
      expect(p!.colorIndex).toBe(0);
    });

    it('returns null when the room is full (>= MAX_PLAYERS)', () => {
      const room = new Room('ABCD');
      for (let i = 0; i < MAX_PLAYERS; i++) {
        room.addPlayer(`s${i}`, `P${i}`);
      }
      const extra = room.addPlayer('extra', 'Extra');
      expect(extra).toBeNull();
    });

    it('uses a default name when an empty string is passed', () => {
      const room = new Room('ABCD');
      const p = room.addPlayer('s1', '');
      expect(p!.name).toMatch(/Player/);
    });

    it('increments the room size on each addition', () => {
      const room = new Room('ABCD');
      expect(room.size).toBe(0);
      room.addPlayer('s1', 'Alice');
      expect(room.size).toBe(1);
      room.addPlayer('s2', 'Bob');
      expect(room.size).toBe(2);
    });
  });

  describe('removePlayer', () => {
    it('removes the player and decrements room size', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.removePlayer('s1');
      expect(room.size).toBe(0);
      expect(room.isEmpty()).toBe(true);
    });

    it('transfers host to the next remaining player when the host leaves', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice'); // host
      room.addPlayer('s2', 'Bob');
      room.removePlayer('s1');

      const remaining = room.getAllPlayers();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]!.socketId).toBe('s2');
      expect(remaining[0]!.isHost).toBe(true);
    });

    it('does not reassign host when a non-host player leaves', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice'); // host
      room.addPlayer('s2', 'Bob');
      room.removePlayer('s2'); // non-host leaves

      const host = room.getPlayer('s1');
      expect(host!.isHost).toBe(true);
    });

    it('does not throw when removing a non-existent player', () => {
      const room = new Room('ABCD');
      expect(() => room.removePlayer('nonexistent')).not.toThrow();
    });

    it('leaves the room empty after removing the only player', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.removePlayer('s1');
      expect(room.isEmpty()).toBe(true);
    });
  });

  describe('isFull / isEmpty', () => {
    it('isEmpty returns true on a fresh room', () => {
      expect(new Room('ABCD').isEmpty()).toBe(true);
    });

    it('isEmpty returns false after adding a player', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      expect(room.isEmpty()).toBe(false);
    });

    it('isFull returns true when MAX_PLAYERS have joined', () => {
      const room = new Room('ABCD');
      for (let i = 0; i < MAX_PLAYERS; i++) room.addPlayer(`s${i}`, `P${i}`);
      expect(room.isFull()).toBe(true);
    });

    it('isFull returns false with fewer than MAX_PLAYERS', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      expect(room.isFull()).toBe(false);
    });
  });

  describe('isHost', () => {
    it('returns true for the first player added', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      expect(room.isHost('s1')).toBe(true);
    });

    it('returns false for non-host players', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.addPlayer('s2', 'Bob');
      expect(room.isHost('s2')).toBe(false);
    });
  });

  describe('toRoomInfo', () => {
    it('includes the room code, maxPlayers, and inGame flag', () => {
      const room = new Room('XYZW');
      room.addPlayer('s1', 'Alice');
      const info = room.toRoomInfo();
      expect(info.code).toBe('XYZW');
      expect(info.maxPlayers).toBe(MAX_PLAYERS);
      expect(info.inGame).toBe(false);
    });

    it('includes all players in the players array', () => {
      const room = new Room('XYZW');
      room.addPlayer('s1', 'Alice');
      room.addPlayer('s2', 'Bob');
      const info = room.toRoomInfo();
      expect(info.players).toHaveLength(2);
    });

    it('LobbyPlayer shape does not expose the internal socketId field', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      const info = room.toRoomInfo();
      // Cast to any to check that the field is truly absent
      expect((info.players[0] as Record<string, unknown>)['socketId']).toBeUndefined();
    });

    it('reflects inGame = true after setting it', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.inGame = true;
      expect(room.toRoomInfo().inGame).toBe(true);
    });
  });

  describe('updatePing / getPings', () => {
    it('updates the ping for a known player', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.updatePing('s1', 42);
      expect(room.getPings()['s1']).toBe(42);
    });

    it('ignores updatePing for an unknown player', () => {
      const room = new Room('ABCD');
      expect(() => room.updatePing('unknown', 99)).not.toThrow();
    });

    it('returns pings for all players', () => {
      const room = new Room('ABCD');
      room.addPlayer('s1', 'Alice');
      room.addPlayer('s2', 'Bob');
      room.updatePing('s1', 10);
      room.updatePing('s2', 20);
      const pings = room.getPings();
      expect(pings['s1']).toBe(10);
      expect(pings['s2']).toBe(20);
    });
  });
});
