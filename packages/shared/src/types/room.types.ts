export interface LobbyPlayer {
  id: string;
  name: string;
  colorIndex: number;
  isHost: boolean;
}

export interface RoomInfo {
  code: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  inGame: boolean;
}
