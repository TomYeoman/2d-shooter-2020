export enum lobbyState {
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    IN_LOBBY = "IN_LOBBY",
    IN_PROGRESS = "IN_PROGRESS",
    ROUND_END = "ROUND_END",
}

export enum gameState {
    WAITING_TO_CONNECT = "WAITING_TO_CONNECT"
}

export enum commandTypes {
    REQUEST_JOIN_GAME = "REQUEST_JOIN_GAME",
}

export enum messageTypes {
    LOBBY_STATE_MESSAGE = "LOBBY_STATE_MESSAGE",
    IDENTITY = "IDENTITY",
}

export enum SCENE_NAMES {
    LOADING = "LOADING",
    MAIN = "MAIN",
    LEVEL_ONE = "LEVEL_ONE",
    LEVEL_ZERO = "LEVEL_ZERO",
  //   GAME_OVER = "GAME_OVER"
  }
