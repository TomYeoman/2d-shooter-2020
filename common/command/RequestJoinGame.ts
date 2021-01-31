import nengi from 'nengi'

class RequestJoinGame {
    name: string

    constructor(name: string) {
        this.name = "User X"
    }
}

//@ts-ignore
RequestJoinGame.protocol = {
    name: nengi.String,
}

export default RequestJoinGame
