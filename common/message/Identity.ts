import nengi from 'nengi'

class Identity {
    entityId:number

    constructor(entityId: number) {
        this.entityId = entityId
    }
}

//@ts-ignore
Identity.protocol = {
    entityId: nengi.UInt16,
}

export default Identity
