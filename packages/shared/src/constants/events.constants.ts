export const EVENTS = {
  // Room
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_ERROR: 'room:error',
  LOBBY_UPDATE: 'lobby:update',

  // Game lifecycle
  GAME_START: 'game:start',
  GAME_STARTING: 'game:starting',
  GAME_STATE_UPDATE: 'game:stateUpdate',
  GAME_OVER: 'game:over',

  // Player
  PLAYER_INPUT: 'player:input',
  PLAYER_PING: 'player:ping',
  PLAYERS_PING: 'players:ping',

  // Game data
  GAME_MAZE: 'game:maze',

  // Utility
  PING: 'ping',
} as const;
