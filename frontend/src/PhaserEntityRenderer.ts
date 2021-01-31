
import {PlayerGraphic} from '../../common/graphics/PlayerGraphic'

class PhaserEntityRenderer {

    entities: Map<string, any>
    scene: Phaser.Scene
    myId: string
    myEntity: any

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.entities = new Map()
    }

    createEntity(entity: any) {
        console.log('renderer create', entity)
        if (entity.protocol.name === 'PlayerCharacter') {
            const clientEntity = new PlayerGraphic(this.scene, entity.x, entity.y)
            this.entities.set(entity.nid, clientEntity)

            // if that entity is ours, save it to myEntity
            if (entity.nid === this.myId) {
                this.myEntity = clientEntity

                const camera = this.scene.cameras.main;
                camera.startFollow(this.myEntity.sprite);
                // camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

                // Watch t

            }
        }

    }

    updateEntity(update: any) {
        const entity = this.entities.get(update.nid)
        entity.sprite[update.prop] = update.value
        // debugger
    }

    processMessage(message: any) {
        if (message.protocol.name === 'Identity') {
            this.myId = message.entityId
            console.log('identified as', this.myId)
        }
    }

    getMouseCoords() {
        const pointer = this.scene.input.activePointer

        return {
            x: pointer.x,
            y: pointer.y,
        }

    }



}

export default PhaserEntityRenderer
