import nengi from 'nengi'
import Identity from '../message/Identity'
import NetLog from '../message/NetLog'
import LobbyStateMessage from '../message/LobbyStateMessage'
import ZombieWaveMessage from '../message/ZombieWaveMessage'
import ClientHudMessage from '../message/ClientHudMessage'
import PlayerEntity from '../entity/PlayerEntity'
import BotEntity from '../entity/BotEntity'
import BulletEntity from '../entity/BulletEntity'
import MoveCommand from '../command/MoveCommand'
import FireCommand from '../command/FireCommand'

import {commandTypes, messageTypes, entityTypes} from '../types/types'
import RequestSpawn from '../command/RequestSpawn'
import RequestJoinGame from '../command/RequestJoinGame'

const config:any = {
    UPDATE_RATE: 30,

    ID_BINARY_TYPE: nengi.UInt16,
    TYPE_BINARY_TYPE: nengi.UInt8,

    ID_PROPERTY_NAME: 'nid',
    TYPE_PROPERTY_NAME: 'ntype',

    USE_HISTORIAN: false,
    HISTORIAN_TICKS: 0,

    protocols: {
        entities: [
            [entityTypes.PLAYER_ENTITY, PlayerEntity],
            [entityTypes.BULLET_ENTITY, BulletEntity],
            [entityTypes.BOT_ENTITY, BotEntity],
            // ['Asteroid', Asteroid]
        ],
        localMessages: [],
        messages: [
            [messageTypes.NET_LOG, NetLog],
            [messageTypes.IDENTITY, Identity],
            [messageTypes.LOBBY_STATE_MESSAGE, LobbyStateMessage],
            [messageTypes.ZOMBIE_WAVE_MESSAGE, ZombieWaveMessage],
            [messageTypes.CLIENT_HUD_MESSAGE, ClientHudMessage]
        ],
        commands: [
            // ['PlayerInput', PlayerInput]
            [commandTypes.MOVE_COMMAND, MoveCommand],
            [commandTypes.REQUEST_GAME_INFO, RequestJoinGame],
            [commandTypes.REQUEST_SPAWN, RequestSpawn],
            [commandTypes.FIRE_COMMAND, FireCommand],
        ],
        basics: []
    }
}

export default config
