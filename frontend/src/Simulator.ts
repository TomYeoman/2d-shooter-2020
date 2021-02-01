import PlayerCharacter from '../../common/entity/PlayerCharacter'

import InputSystem from "./InputSystem"
import MoveCommand from '../../common/command/MoveCommand'
import nengi from 'nengi'
import PhaserEntityRenderer from './PhaserEntityRenderer'
import { lobbyState, messageTypes } from '../../common/types/types'
import LobbyStateMessage from '../../common/message/LobbyStateMessage'

class Simulator {

    client: nengi.Client
    input: InputSystem
    entities: Map<string, any>
    renderer: PhaserEntityRenderer

    entityIdSelf : number
    myEntity : PlayerCharacter | null

    constructor(client: nengi.Client, phaserInstance: Phaser.Scene, sceneMap: Phaser.Tilemaps.Tilemap) {
        this.client = client
        this.input = new InputSystem()
        this.entities = new Map()

        this.entityIdSelf = -1


        this.myEntity = null
        this.renderer = new PhaserEntityRenderer(phaserInstance, sceneMap)
    }

    createEntity(entity: any) {
        console.log('creating entity', entity)

        if (entity.protocol.name === 'PlayerCharacter') {
            let newEntity = new PlayerCharacter(entity.x, entity.y)
            Object.assign(newEntity, entity)
            this.entities.set(newEntity.nid, newEntity)
            this.renderer.createEntity(entity)

            // debugger;
            if (entity.nid === this.entityIdSelf) {
                console.log('discovered self')
                this.myEntity = newEntity
            }
        }
    }

    updateEntity(update: any) {
        const entity = this.entities.get(update.nid)
        entity[update.prop] = update.value

        this.renderer.updateEntity(update)
    }

    deleteEntity(id: string) {
        this.entities.delete(id)
    }

    processMessage(message: any) {

        if (message.protocol.name === messageTypes.LOBBY_STATE_MESSAGE) {
            const lobbyMessage: LobbyStateMessage = message

            console.log("Recieved update on lobby state")

            if (lobbyMessage.state === lobbyState.WAITING_FOR_PLAYERS) {
                this.renderer.displayText(`Waiting for players, currently ${lobbyMessage.playerCount} / ${lobbyMessage.lobbyMinimum}` )
            }

            if (lobbyMessage.state === lobbyState.IN_PROGRESS) {
                // LOAD THE MAP
                console.log("Loading map in progress")
                this.renderer.loadLevel(lobbyMessage.scene)
            }

        }

        if (message.protocol.name === messageTypes.IDENTITY) {
            // be able to access self from simular
            console.log('identified as', message)
            this.entityIdSelf = message.entityId

            // Also create a self representation, in the rendered
            this.renderer.processMessage(message)
        }
    }

    update(delta: number) {
        const input = this.input.frameState

        if (this.myEntity) {
            let rotation = 0

            // calculate the direction our character is facing

            const { x, y } = this.renderer.getMouseCoords()
            // const spriteX = (-this.renderer.scene.cameras.main.x + this.renderer.myEntity.sprite.x)
            // const spriteY = (-this.renderer.scene.cameras.main.y + this.renderer.myEntity.sprite.y)
            const spriteX = this.renderer.myEntity.sprite.x
            const spriteY =  this.renderer.myEntity.sprite.y

            // console.log(`mouse x ${x}, y${y}`)
            // console.log(`sprite x ${spriteX}, sprite y${spriteY}`)
            const dx = x - spriteX
            const dy = y - spriteY

            // console.log(`char X ${this.renderer.myEntity.sprite.x}, char Y: ${this.renderer.myEntity.sprite.y}`)
            // console.log(`dx ${dx}, dy: ${dy}`)

            // console.log(dx)
            // console.log(dy)
            rotation = Math.atan2(dy, dx)

            // console.log(rotation)

            const moveCommand = new MoveCommand(input.w, input.a, input.s, input.d, rotation, delta)
            this.client.addCommand(moveCommand)
        }

        this.input.releaseKeys()

    }


}

export default Simulator;