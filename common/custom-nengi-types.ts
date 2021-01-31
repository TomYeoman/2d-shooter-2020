// custom-fc.ts : enhances declaration of FC namespace
import nengi from 'nengi'


export declare namespace ExtendedNengiTypes {
    class Instance extends nengi.Instance {
        emit(...args: any[]):void
        onConnect(fn: (client:any, data:any, callback:any) => void): void
        onDisconnect(fn: (client: nengi.Client) => void): void
        getNextCommand(): any
        createChannel(): any
        set(entityId:string, entity:any): void
    }
    class Client extends nengi.Client {
       onConnect(fn: (res:any) => void): void
       onClose(fn: () => void): void
    }

    let testProperty: any;
}
