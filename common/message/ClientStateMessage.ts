import nengi from 'nengi'
import { CLIENT_SCENE_STATE } from '../types/types'

class ClientStateMessage {
    constructor(
        public state: CLIENT_SCENE_STATE,
    ) {}
}

//@ts-ignore
ClientStateMessage.protocol = {
    state: nengi.String,
}

export default ClientStateMessage
