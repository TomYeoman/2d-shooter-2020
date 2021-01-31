export enum lobbyState {
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    WAITING_ROUND_END = "WAITING_ROUND_END",
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