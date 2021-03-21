import nengi from 'nengi'

class PlayerCharacter {
    x: number
    y: number
    rotation: number
    hitpoints: number
    isAlive: boolean
    speed: number

    moveDirection: {
        x: number
        y: number
    }

    // Automatically assigned when added to nengi
    nid: number
    ntype: string

    // Added ourself, not sent over wire?
    client: any

    constructor(x:number, y:number ) {
        this.x = x;
        this.y = y
        this.rotation = 0
        this.hitpoints = 100
        this.isAlive = false

        this.moveDirection = {
            x: 0,
            y: 0
        }

        this.speed = 150
    }

    fire() {
    }

    processMove(command: any) {

        this.rotation = command.rotation

        let unitX = 0
        let unitY = 0

        // create forces from input
        if (command.forward) { unitY -= 5 }
        if (command.backward) { unitY += 5 }
        if (command.left) { unitX -= 5 }
        if (command.right) { unitX += 5 }

        // normalize
        const len = Math.sqrt(unitX * unitX + unitY * unitY)
        if (len > 0) {
            unitX = unitX / len
            unitY = unitY / len
        }

        this.moveDirection.x = unitX
        this.moveDirection.y = unitY

        this.x += this.moveDirection.x * this.speed * command.delta
        this.y += this.moveDirection.y * this.speed * command.delta
    }
}

//@ts-ignore
PlayerCharacter.protocol = {
    x: { type: nengi.Float32, interp: true },
    y: { type: nengi.Float32, interp: true },
    rotation: { type: nengi.RotationFloat32, interp: true },
    isAlive: nengi.Boolean,
    hitpoints: nengi.UInt8
}

export default PlayerCharacter
