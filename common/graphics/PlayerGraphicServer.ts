import WeaponSystem from '../modules/WeaponSystem'
import { ExtendedNengiTypes } from '../types/custom-nengi-types'
import Phaser from "phaser"
import BotGraphicServer from './BotGraphicServer'
import BulletGraphicServer from './BulletGraphicServer'
import BulletEntity from '../entity/BulletEntity'

export default class PlayerGraphicServer extends Phaser.Physics.Arcade.Sprite{

    weaponSystem: WeaponSystem
    nengiInstance: ExtendedNengiTypes.Instance
    rotation = 0
    speed: number
    bulletEntities: Map<number, any>
    associatedEntityId: number

    constructor(
        scene: Phaser.Scene,
        worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        nengiInstance: ExtendedNengiTypes.Instance,
        // bots : any,
        xStart: number,
        yStart: number,
        associatedEntityId: number
    ) {


        super(scene, xStart, yStart, "player")
        scene.add.existing(this)
        scene.physics.add.existing(this)

        console.log("Setting up collision with world")
        scene.physics.add.collider(this, worldLayer);

        this.associatedEntityId = associatedEntityId

        this.setCircle(15)
        // this.setOffset(15)
        this.bulletEntities = new Map()


        this.speed = 1000
        this.weaponSystem = new WeaponSystem()
        this.nengiInstance = nengiInstance

        // Set a callback to update this entity, with current rendered position every
        setInterval(() => {
            this.bulletEntities.forEach((bullet) => {
                const associatedEntity = this.nengiInstance.getEntity(bullet.associatedEntityId)

                if (!associatedEntity) {
                    console.log("Trying to update positions of bullet graphic, but cannot find an entity")
                    return
                }

                associatedEntity.x = bullet.x
                associatedEntity.y = bullet.y
            })
        }, 1000 / 20);


    }

    fire(mouseX: number, mouseY: number, bots:any ) {
        // Set on cooldown - will check soon
        // this.weaponSystem.fire()

        const bulletEntity = new BulletEntity(this.x, this.y)
        this.nengiInstance.addEntity(bulletEntity)

        // We now have a bullet created, that has a link to the entity so we can update it easily
        const bulletGraphic = new BulletGraphicServer(this.scene, bulletEntity.nid, this.x, this.y, Phaser.Math.RadToDeg(this.rotation), bots, this.processBulletHit)
        this.bulletEntities.set(bulletGraphic.associatedEntityId, bulletGraphic)

        setTimeout(() => {

            // Remove client instance
            this.nengiInstance.removeEntity(bulletEntity)

            // Delete server copy
            const bullet = this.bulletEntities.get(bulletGraphic.associatedEntityId)
            bullet.destroy()
            this.bulletEntities.delete(bullet.associatedEntityId)
        }, 1000)

        // bulletGraphic.destroy()

        // Create entity

        return true
    }

    processBulletHit(obj: any, obj2: any) {
        // console.log(`Bullet hit a zombie ${obj.associatedEntityId} hit zombie ${obj2.name}`)

        if (obj2.type === "BOT") {
            obj2.takeDamage(obj.associatedEntityId)
        }
    }

    processMove(command: any) {

        this.rotation = command.rotation

        const speed = this.speed * command.delta * 10;
        // const prevVelocity = this.body.velocity.clone();

        // Stop any previous movement from the last frame
        this.setVelocity(0);

        // Horizontal movement
        if (command.left) {
            this.setVelocityX(-speed)
        } else if (command.right) {
            this.setVelocityX(speed)
        }

        // Vertical movement
        if (command.forward) {
            this.setVelocityY(-speed)
        }
        if (command.backward) {
            this.setVelocityY(speed)
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        // this.body.velocity.normalize().scale(speed);


    }
}
