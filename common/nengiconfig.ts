import nengi from 'nengi'
import Identity from './Identity'
import NetLog from './NetLog'
import PlayerCharacter from './entity/PlayerCharacter'
// import PlayerCharacter from './PlayerCharacter.js'
// import Asteroid from './Asteroid.js'
// import PlayerInput from './PlayerInput.js'
// import Identity from './Identity.js'
import MoveCommand from './command/MoveCommand'

const config:any = {
    UPDATE_RATE: 30,

    ID_BINARY_TYPE: nengi.UInt16,
    TYPE_BINARY_TYPE: nengi.UInt8,

    ID_PROPERTY_NAME: 'nid',
    TYPE_PROPERTY_NAME: 'ntype',

    USE_HISTORIAN: true,
    HISTORIAN_TICKS: 40,

    protocols: {
        entities: [
            ['PlayerCharacter', PlayerCharacter],
            // ['Asteroid', Asteroid]
        ],
        localMessages: [],
        messages: [
            ['NetLog', NetLog],
            ['Identity', Identity]
        ],
        commands: [
            // ['PlayerInput', PlayerInput]
            ['MoveCommand', MoveCommand],
        ],
        basics: []
    }
}

export default config
