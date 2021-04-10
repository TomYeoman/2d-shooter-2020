import PlayerEntity from '../../common/entity/PlayerEntity'

import InputSystem from "./InputSystem"
import MoveCommand from '../../common/command/MoveCommand'
import nengi from 'nengi'
import PhaserEntityRenderer from './PhaserEntityRenderer'
import { entityTypes, lobbyState, messageTypes } from '../../common/types/types'
import LobbyStateMessage from '../../common/message/LobbyStateMessage'
import FireCommand from '../../common/command/FireCommand'
import BotEntity from '../../common/entity/BotEntity'
import BulletEntity from '../../common/entity/BulletEntity'

class Simulator {

    nengiClient: nengi.Client
    input: InputSystem
    entities: Map<number, any>
    renderer: PhaserEntityRenderer

    entityIdSelf : number
    myEntity : PlayerEntity | null

    constructor(nengiClient: nengi.Client, phaserInstance: Phaser.Scene, sceneMap: Phaser.Tilemaps.Tilemap) {
        this.nengiClient = nengiClient
        this.input = new InputSystem()
        this.entities = new Map()

        this.entityIdSelf = -1


        this.myEntity = null
        this.renderer = new PhaserEntityRenderer(phaserInstance, sceneMap)
    }

    createEntity(entity: any) {
        console.log(`creating new ${entity.protocol.name} entity (Simulator)`)

        if (entity.protocol.name === entityTypes.PLAYER_ENTITY) {
            let newEntity = new PlayerEntity(entity.x, entity.y)
            Object.assign(newEntity, entity)
            this.entities.set(newEntity.nid, newEntity)
            this.renderer.createEntity(entity)

            // debugger;
            if (entity.nid === this.entityIdSelf) {
                console.log(`Discovered local version of my remote entity, with id ${entity.nid}`)
                this.myEntity = newEntity
            }
        }

        if (entity.protocol.name === entityTypes.BOT_ENTITY) {
            let newEntity = new BotEntity(entity.x, entity.y)
            Object.assign(newEntity, entity)
            this.entities.set(newEntity.nid, newEntity)
            this.renderer.createEntity(entity)
        }

        if (entity.protocol.name === entityTypes.BULLET_ENTITY) {
            let newEntity = new BulletEntity(entity.x, entity.y, entity.rotation)
            Object.assign(newEntity, entity)
            this.entities.set(newEntity.nid, newEntity)
            this.renderer.createEntity(entity)
        }
    }

    updateEntity(update: any) {
        const entity = this.entities.get(update.nid)

        if (entity) {
            entity[update.prop] = update.value
            this.renderer.updateEntity(update)
        } else {
            console.log(`Tried to update entity ${update.nid} but it doesn't exist yet`)

        }
    }

    deleteEntity(id: number) {
        this.entities.delete(id)
        this.renderer.deleteEntity(id)
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
                console.log(`Attempting to load scene ${lobbyMessage.scene}`)
                this.renderer.loadLevel(lobbyMessage.scene, this.nengiClient)
            }

        }

        if (message.protocol.name === messageTypes.IDENTITY) {
            // be able to access self from simular
            console.log('Assigned my remote entity ID as ', message.entityId)
            this.entityIdSelf = message.entityId
            // Also create a self representation, in the rendered
            this.renderer.processMessage(message)

            // If we had already created entities (I.E we recieved IDENTIFY after the entities were sent - happens on low FPS ) -
            // we should go and assign them to ourselves correctly now
            let existingEntity = this.entities.get(message.entityId)
            if (!existingEntity) {
                console.log("Recieved identity before the entity, therefore no need to assign an entity at point of recieivng identity")
                return
            } else {
                this.myEntity = existingEntity
                // Also setup rendereds reference to entity
                this.renderer.assignClientEntity(message.entityId)
            }

        }
    }

    update(delta: number) {


        // console.log("Calling update")
        const input = this.input.frameState

        if (this.myEntity) {
            let rotation = 0

            // calculate the direction our character is facing
            const { mouseX, mouseY } = this.renderer.getMouseCoords()

            const spriteX = this.renderer.myEntity.x
            const spriteY =  this.renderer.myEntity.y

            rotation = Math.atan2( mouseY - spriteY, mouseX - spriteX)

            // Send this frames movement info
            if (input.mouseDown) {
                this.nengiClient.addCommand(new FireCommand(mouseX, mouseY))
            }

            console.log(rotation)
            this.nengiClient.addCommand(new MoveCommand(input.w, input.a, input.s, input.d, rotation, delta))

        } else {
            console.log("No entity found for player to move")
        }

        this.input.releaseKeys()

    }


}

export default Simulator;