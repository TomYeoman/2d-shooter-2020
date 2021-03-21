import nengi from 'nengi'

class FireCommand {
    constructor(private x:number, private y:number) {
        this.x = x
        this.y = y
    }
}

//@ts-ignore
FireCommand.protocol = {
    x: nengi.Int32,
    y: nengi.Int32
}

export default FireCommand
