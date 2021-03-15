import nengi from 'nengi'
import Identity from '../message/Identity'
import NetLog from '../message/NetLog'
import LobbyStateMessage from '../message/LobbyStateMessage'
import PlayerCharacter from '../entity/PlayerCharacter'
// import PlayerCharacter from './PlayerCharacter.js'
// import Asteroid from './Asteroid.js'
// import PlayerInput from './PlayerInput.js'
// import Identity from './Identity.js'
import MoveCommand from '../command/MoveCommand'
import RequestJoinGame from '../command/RequestJoinGame'
import {commandTypes, messageTypes} from '../types/types'

const config:any = {
    UPDATE_RATE: 20,

    ID_BINARY_TYPE: nengi.UInt16,
    TYPE_BINARY_TYPE: nengi.UInt8,

    ID_PROPERTY_NAME: 'nid',
    TYPE_PROPERTY_NAME: 'ntype',

    USE_HISTORIAN: false,
    HISTORIAN_TICKS: 0,

    protocols: {
        entities: [
            ['PlayerCharacter', PlayerCharacter],
            // ['Asteroid', Asteroid]
        ],
        localMessages: [],
        messages: [
            ['NetLog', NetLog],
            [messageTypes.IDENTITY, Identity],
            [messageTypes.LOBBY_STATE_MESSAGE, LobbyStateMessage]
        ],
        commands: [
            // ['PlayerInput', PlayerInput]
            ['MoveCommand', MoveCommand],
            [commandTypes.REQUEST_JOIN_GAME, RequestJoinGame],
        ],
        basics: []
    }
}

export default config
