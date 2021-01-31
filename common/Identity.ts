import nengi from 'nengi'

class Identity {
    entityId:string

    constructor(entityId: string) {
        this.entityId = entityId
    }
}

//@ts-ignore
Identity.protocol = {
    entityId: nengi.UInt16,
}

export default Identity
