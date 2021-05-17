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
    REQUEST_GAME_INFO = "REQUEST_GAME_INFO",
    REQUEST_SPAWN = "REQUEST_SPAWN",
    MOVE_COMMAND = "MOVE_COMMAND",
    FIRE_COMMAND = "FIRE_COMMAND",
    MODIFY_TOOLBAR_COMMAND = "MODIFY_TOOLBAR_COMMAND"
}

export enum messageTypes {
    CLIENT_HUD_MESSAGE = "CLIENT_HUD_MESSAGE",
    CLIENT_STATE_MESSAGE = "CLIENT_STATE_MESSAGE",
    ZOMBIE_WAVE_MESSAGE = "ZOMBIE_WAVE_MESSAGE",
    NET_LOG = "NET_LOG",
    LOBBY_STATE_MESSAGE = "LOBBY_STATE_MESSAGE",
    IDENTITY = "IDENTITY",
    TOOLBAR_UPDATED_MESSAGE = "TOOLBAR_UPDATED_MESSAGE",
}

export enum entityTypes {
    PLAYER_ENTITY = "PLAYER_ENTITY",
    BULLET_ENTITY = "BULLET_ENTITY",
    BOT_ENTITY = "BOT_ENTITY",
}

export enum SCENE_NAMES {
    LOADING = "LOADING",
    MAIN = "MAIN",
    LEVEL_ONE = "LEVEL_ONE",
    LEVEL_ZERO = "LEVEL_ZERO",
  //   GAME_OVER = "GAME_OVER"
}

export enum CLIENT_SCENE_STATE {
    ALIVE = "ALIVE",
    DEAD = "DEAD",
    SPECTATING = "ALIVE",
}
