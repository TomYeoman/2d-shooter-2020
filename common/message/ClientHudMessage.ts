import nengi from 'nengi'

class ClientHudMessage {
    constructor(
        public health: number,
        public ammo: string,
        public gunName: string,
    ) {}
}

//@ts-ignore
ClientHudMessage.protocol = {
    health: nengi.UInt8,
    ammo: nengi.UInt16,
    gunName: nengi.UInt16,
}

export default ClientHudMessage
