
import nengi from 'nengi'
import {PlayerGraphic} from '../../common/graphics/PlayerGraphic'
import { messageTypes } from '../../common/types/types'
import { SCENE_NAMES } from './game/index'

class PhaserEntityRenderer {

    entities: Map<string, any>
    scene: Phaser.Scene
    myId: string
    myEntity: any
    sceneMap: Phaser.Tilemaps.Tilemap
    stageText: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, sceneMap: Phaser.Tilemaps.Tilemap ) {
        this.scene = scene
        this.entities = new Map()
        this.sceneMap = sceneMap
    }

    createEntity(entity: any) {
        console.log(`creating new ${entity.protocol.name} entity ( Renderer )`)

        if (entity.protocol.name === 'PlayerCharacter') {
            const clientEntity = new PlayerGraphic(this.scene, entity.x, entity.y)
            this.entities.set(entity.nid, clientEntity)

            // if that entity is ours, save it to myEntity
            if (entity.nid === this.myId) {
                this.myEntity = clientEntity

                const camera = this.scene.cameras.main;
                camera.startFollow(this.myEntity.sprite);
                camera.setBounds(0, 0, this.sceneMap.widthInPixels, this.sceneMap.heightInPixels);

            }
        }

    }

    updateEntity(update: any) {
        const entity = this.entities.get(update.nid)
        entity.sprite[update.prop] = update.value
        // debugger
    }

    processMessage(message: any) {
        if (message.protocol.name === messageTypes.IDENTITY) {
            // Use this to track camera against the correct entity
            this.myId = message.entityId
            console.log('Assigned my remote entity ID as ', this.myId)
        }
    }

    getMouseCoords() {
        const pointer = this.scene.input.activePointer

        return {
            x: pointer.x,
            y: pointer.y,
        }

    }

    displayText(text: string) {
        const textStyle:any = {
            fill: "#ffffff",
            align: "center",
            fontSize: 30,
            fontStyle: "bold"
        };

        const width = Number(this.scene.game.config.width);
        const height = Number(this.scene.game.config.height);

        if (!this.stageText) {
            this.stageText = this.scene.add
                .text(width / 2, height / 2 + 250, text, textStyle)
                .setOrigin(0.5, 0);
        } else {
            this.stageText.text = text
        }

        // const loadingBar = this.scene.add.graphics();
        // loadingBar.clear();
        // loadingBar.fillStyle(0xffffff, 1);
        // loadingBar.fillRect(width / 2 - 375, height / 2 - 25, 750 * value, 50);
        // const mod = Phaser.Math.FloorTo(((value * 100) % 3) + 1, 0);
        // const text = `Loading${".".repeat(mod)}${mod <= 2 ? " ".repeat(3 - mod) : ""}`;

    }

    loadLevel(scene: string, nengiClient: nengi.Client) {

        if (!Object.values(SCENE_NAMES).includes(scene as SCENE_NAMES)) {
            debugger
            console.warn("Unable to find scene ", scene)
        } else {
            let sceneName = scene as SCENE_NAMES
            this.scene.scene.sleep(SCENE_NAMES.MAIN)
            this.scene.scene.run(SCENE_NAMES[sceneName], { nengiClient })
        }
    }

}

export default PhaserEntityRenderer
