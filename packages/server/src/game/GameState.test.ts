import { describe, it, expect } from 'vitest';
import { GameState } from './GameState.js';
import { GOAL_X, GOAL_Y, GOAL_RADIUS, SPHERE_RADIUS } from '@sphere-coop/shared';
import type { RoomPlayer } from '../rooms/Room.js';

function makePlayers(count: number): RoomPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    socketId: `player-${i}`,
    id: `player-${i}`,
    name: `Player ${i}`,
    colorIndex: i,
    isHost: i === 0,
    ping: 0,
  }));
}

describe('GameState', () => {
  describe('tick counter', () => {
    it('starts at 0 and increments by 1 each tick', () => {
      const gs = new GameState(makePlayers(1));
      const { state: s1 } = gs.tick();
      expect(s1.tick).toBe(1);
      const { state: s2 } = gs.tick();
      expect(s2.tick).toBe(2);
      const { state: s3 } = gs.tick();
      expect(s3.tick).toBe(3);
    });
  });

  describe('walls in snapshot', () => {
    it('includes walls array on tick 1', () => {
      const gs = new GameState(makePlayers(1));
      const { state } = gs.tick();
      expect(state.walls).toBeDefined();
      expect(Array.isArray(state.walls)).toBe(true);
      expect(state.walls!.length).toBeGreaterThan(0);
    });

    it('includes walls for the first 40 ticks', () => {
      const gs = new GameState(makePlayers(1));
      for (let i = 1; i <= 40; i++) {
        const { state } = gs.tick();
        expect(state.walls).toBeDefined();
      }
    });

    it('does not include walls after tick 40', () => {
      const gs = new GameState(makePlayers(1));
      for (let i = 0; i < 40; i++) gs.tick();
      const { state } = gs.tick(); // tick 41
      expect(state.walls).toBeUndefined();
    });
  });

  describe('snapshot immutability', () => {
    it('mutating a snapshot does not affect internal state', () => {
      const gs = new GameState(makePlayers(1));
      const { state: s1 } = gs.tick();
      s1.players[0]!.x = 9999; // mutate snapshot copy

      const { state: s2 } = gs.tick();
      // Internal state should not have been affected by the mutation above
      expect(s2.players[0]!.x).not.toBe(9999);
    });

    it('each snapshot contains all players', () => {
      const count = 3;
      const gs = new GameState(makePlayers(count));
      const { state } = gs.tick();
      expect(state.players).toHaveLength(count);
    });
  });

  describe('no winner at spawn', () => {
    it('returns null winner when players start at spawn positions', () => {
      const gs = new GameState(makePlayers(2));
      const { winner } = gs.tick();
      expect(winner).toBeNull();
    });

    it('returns null winner over many ticks without input', () => {
      const gs = new GameState(makePlayers(1));
      for (let i = 0; i < 10; i++) {
        const { winner } = gs.tick();
        expect(winner).toBeNull();
      }
    });
  });

  describe('setInput effect', () => {
    it('input moves the player in the given direction', () => {
      const gs = new GameState(makePlayers(1));
      const { state: s0 } = gs.tick();
      const startX = s0.players[0]!.x;

      gs.setInput('player-0', { left: false, right: true, up: false, down: false });
      const { state: s1 } = gs.tick();
      expect(s1.players[0]!.x).toBeGreaterThan(startX);
    });

    it('player without input stays near their spawn (velocity stays ~0)', () => {
      const gs = new GameState(makePlayers(1));
      gs.tick(); // tick 1 — no input set
      const { state } = gs.tick(); // tick 2
      expect(Math.abs(state.players[0]!.vx)).toBeLessThan(1);
      expect(Math.abs(state.players[0]!.vy)).toBeLessThan(1);
    });
  });

  describe('win detection via _teleportPlayerForTesting', () => {
    it('returns winner when player is at the goal center', () => {
      const gs = new GameState(makePlayers(1));
      gs._teleportPlayerForTesting('player-0', GOAL_X, GOAL_Y);
      const { winner } = gs.tick();
      expect(winner).not.toBeNull();
      expect(winner!.winnerId).toBe('player-0');
      expect(winner!.winnerName).toBe('Player 0');
    });

    it('winner timeMs is a non-negative number', () => {
      const gs = new GameState(makePlayers(1));
      gs._teleportPlayerForTesting('player-0', GOAL_X, GOAL_Y);
      const { winner } = gs.tick();
      expect(winner!.timeMs).toBeGreaterThanOrEqual(0);
    });

    it('returns winner for a player just inside the goal radius', () => {
      const gs = new GameState(makePlayers(1));
      // Place player 1 px inside the win threshold
      const offset = SPHERE_RADIUS + GOAL_RADIUS - 1;
      gs._teleportPlayerForTesting('player-0', GOAL_X + offset, GOAL_Y);
      const { winner } = gs.tick();
      expect(winner).not.toBeNull();
    });

    it('returns null when player is clearly outside the goal radius', () => {
      const gs = new GameState(makePlayers(1));
      // Place far enough that even a wall push cannot bring them into the goal
      const safeOffset = SPHERE_RADIUS + GOAL_RADIUS + SPHERE_RADIUS + 5;
      gs._teleportPlayerForTesting('player-0', GOAL_X + safeOffset, GOAL_Y);
      const { winner } = gs.tick();
      expect(winner).toBeNull();
    });

    it('identifies the correct winner among multiple players', () => {
      const gs = new GameState(makePlayers(3));
      gs._teleportPlayerForTesting('player-1', GOAL_X, GOAL_Y);
      const { winner } = gs.tick();
      expect(winner!.winnerId).toBe('player-1');
      expect(winner!.winnerName).toBe('Player 1');
    });

    it('_teleportPlayerForTesting is a no-op for an unknown socketId', () => {
      const gs = new GameState(makePlayers(1));
      // Should not throw
      expect(() => gs._teleportPlayerForTesting('unknown', GOAL_X, GOAL_Y)).not.toThrow();
      const { winner } = gs.tick();
      expect(winner).toBeNull(); // player-0 still at spawn
    });
  });
});
