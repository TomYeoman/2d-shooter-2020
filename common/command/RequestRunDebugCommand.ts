import nengi from 'nengi'
import { REQUEST_DEBUG_COMMAND_TYPES } from '../types/types'

class RequestRunDebugCommand {
    constructor(public debugCommand:REQUEST_DEBUG_COMMAND_TYPES) {
        this.debugCommand = debugCommand
    }
}

//@ts-ignore
RequestRunDebugCommand.protocol = {
    // selectedSlot: nengi.Int6,
}

export default RequestRunDebugCommand
