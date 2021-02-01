import nengi from 'nengi'
import {lobbyState} from "../types/types"

class LobbyStateMessage {
    state: string
    gameMode: string
    scene: string
    playerCount: number
    lobbyMinimum: number

    constructor(state:lobbyState, gameMode: string, scene:string, playerCount: number, lobbyMinimum: number) {
        this.state = state
        this.gameMode = gameMode
        this.scene = scene
        this.playerCount = playerCount
        this.lobbyMinimum = lobbyMinimum
    }
}

//@ts-ignore
LobbyStateMessage.protocol = {
    state: nengi.String,
    gameMode: nengi.String,
    scene: nengi.String,
    playerCount: nengi.Int8,
    lobbyMinimum: nengi.Int8
}

export default LobbyStateMessage
