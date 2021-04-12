
import nengi from 'nengi'
import PlayerGraphicClient from '../../common/graphics/PlayerGraphicClient'
import BotGraphicClient from '../../common/graphics/BotGraphicClient'
import { entityTypes, messageTypes } from '../../common/types/types'
import { SCENE_NAMES } from './game/index'
import BulletGraphicClient from '../../common/graphics/BulletGraphicClient'
import ZombieWaveMessage from '../../common/message/ZombieWaveMessage'
import ClientHudMessage from '../../common/message/ClientHudMessage'

class PhaserEntityRenderer {

    entities: Map<number, any>
    scene: Phaser.Scene
    myId: string
    myEntity: Phaser.GameObjects.Sprite
    sceneMap: Phaser.Tilemaps.Tilemap

    healthText: Phaser.GameObjects.Text
    waveInfoText: Phaser.GameObjects.Text
    hudText: Phaser.GameObjects.Text
    stageText: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, sceneMap: Phaser.Tilemaps.Tilemap ) {
        this.scene = scene
        this.entities = new Map()
        this.sceneMap = sceneMap
    }

    createEntity(entity: any) {
        console.log(`creating new ${entity.protocol.name} entity ( Renderer )`)

        if (entity.protocol.name === entityTypes.PLAYER_ENTITY) {
            const clientEntity = new PlayerGraphicClient(this.scene, entity.x, entity.y)
            this.scene.add.existing(clientEntity)
            this.entities.set(entity.nid, clientEntity)

            // We may already have an identity, in which case follow at point of recieving entity
            if (entity.nid === this.myId) {
                this.myEntity = clientEntity
                this.setupCamera()
            }
        }

        if (entity.protocol.name === entityTypes.BOT_ENTITY) {
            const botEntity = new BotGraphicClient(this.scene, entity.x, entity.y)
            this.scene.add.existing(botEntity)
            this.entities.set(entity.nid, botEntity)
        }

        if (entity.protocol.name === entityTypes.BULLET_ENTITY) {
            const bulletEntity = new BulletGraphicClient(this.scene, entity.x, entity.y)
            this.scene.add.existing(bulletEntity)
            this.entities.set(entity.nid, bulletEntity)
        }

    }

    // We may already recieve identity AFTER recieving entities, in which case follow at point of recieving entity
    assignClientEntity(entityId: number) {

        let clientEntity = this.entities.get(entityId)
        this.myEntity = clientEntity
        this.setupCamera()
    }

    setupCamera() {
        const camera = this.scene.cameras.main;
        camera.startFollow(this.myEntity);
        camera.setBounds(0, 0, this.sceneMap.widthInPixels, this.sceneMap.heightInPixels);
        // camera.zoom= 2
    }

    updateEntity(update: any) {
        const entity = this.entities.get(update.nid)
        entity[update.prop] = update.value
        // debugger
    }

    deleteEntity(entityId: number) {
        const entity = this.entities.get(entityId)

        if (entity) {
            entity.destroy()
            this.entities.delete(entityId)
        } else {
            console.log(`Rendered tried to delete entity ${entityId} that doesn't exist `)
        }
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
            mouseX: pointer.worldX,
            mouseY: pointer.worldY,
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

    displayWaveHud(zombieWaveMessage: ZombieWaveMessage) {

        const textStyle:any = {
            fill: "#ffffff",
            align: "left",
            fontSize: 15,
            fontStyle: "bold"
        };

        const message = `
        Game State          : ${zombieWaveMessage.gameStatus}
        Current wave        : ${zombieWaveMessage.currentWave}
        Zombies Remaining   : ${zombieWaveMessage.zombiesRemaining}
        Zombies Killed      : ${zombieWaveMessage.zombiesKilled}
        Zombies Alive       : ${zombieWaveMessage.zombiesAlive}
        Players             : ${zombieWaveMessage.playersAlive} / ${zombieWaveMessage.playersTotal}
    `

        if (!this.waveInfoText) {
            this.waveInfoText = this.scene.add
                .text(10, 10, message, textStyle)
                // .setOrigin(0.5, 0);
                .setScrollFactor(0)

        } else {
            this.waveInfoText.text = message
        }

        // const loadingBar = this.scene.add.graphics();
        // loadingBar.clear();
        // loadingBar.fillStyle(0xffffff, 1);
        // loadingBar.fillRect(width / 2 - 375, height / 2 - 25, 750 * value, 50);
        // const mod = Phaser.Math.FloorTo(((value * 100) % 3) + 1, 0);
        // const text = `Loading${".".repeat(mod)}${mod <= 2 ? " ".repeat(3 - mod) : ""}`;

    }

    displayUserHUD(clientHudMessage: ClientHudMessage) {

        let healthColor = ""

        if (clientHudMessage.health < 50) {
            if (clientHudMessage.health < 30) {
                healthColor = "#d9534f"
            } else {
                healthColor = "#f0ad4e"
            }
        } else {
            healthColor = "#5cb85c"
        }

        const healthStyle:any = {
            fill:healthColor,
            align: "left",
            fontSize: 15,
            fontStyle: "bold"
        };

        const otherHudStyle:any = {
            fill: "#ffffff",
            align: "left",
            fontSize: 15,
            fontStyle: "bold"
        };

        const healthMessage = `
        Health  : ${clientHudMessage.health}
        `

        const hudMessage = `
        Gun : ${clientHudMessage.gunName}
        Ammo       : ${clientHudMessage.ammo}
        `

        const width = Number(this.scene.game.config.width);


        if (!this.healthText) {
            this.healthText = this.scene.add
                .text(width - 200, 10, healthMessage, healthStyle)
                // .setOrigin(0.5, 0);
                .setScrollFactor(0)
        } else {
            this.healthText.text = healthMessage
        }

        if (!this.hudText) {
            this.hudText = this.scene.add
                .text(width - 200, 40, hudMessage, otherHudStyle)
                // .setOrigin(0.5, 0);
                .setScrollFactor(0)
        } else {
            this.hudText.text = hudMessage
        }

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
