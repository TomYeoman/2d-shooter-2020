import WeaponSystem from "../../../common/modules/WeaponSystem";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Phaser from "phaser";
import BotGraphicServer from "./BotGraphicServer";
import BulletGraphicServer from "./BulletGraphicServer";
import BulletEntity from "../../../common/entity/BulletEntity";

export default class PlayerGraphicServer extends Phaser.Physics.Arcade.Sprite{

    weaponSystem: WeaponSystem
    nengiInstance: ExtendedNengiTypes.Instance
    rotation = 0
    speed: number
    bulletGraphics: Map<number, any>
    health = 100

    associatedEntityId: number
    worldLayer: Phaser.Tilemaps.StaticTilemapLayer

    constructor(
        scene: Phaser.Scene,
        worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        nengiInstance: ExtendedNengiTypes.Instance,
        // bots : any,
        xStart: number,
        yStart: number,
        associatedEntityId: number
    ) {


        super(scene, xStart, yStart, "player");
        this.bulletGraphics = new Map();
        this.speed = 1000;

        this.weaponSystem = new WeaponSystem();
        this.nengiInstance = nengiInstance;
        this.worldLayer = worldLayer;
        this.associatedEntityId = associatedEntityId;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setSize(50,50)
        this.setDisplaySize(50, 50)

        console.log("Setting up collision with world");
        scene.physics.add.collider(this, worldLayer);
     this.body.immovable = true

        // // Set a callback to update this entity, with current rendered position every
        // setInterval(() => {
        //     this.bulletGraphics.forEach((bullet) => {
        //         const associatedEntity = this.nengiInstance.getEntity(bullet.associatedEntityId);

        //         if (!associatedEntity) {
        //             console.log("Trying to update positions of bullet graphic, but cannot find an entity");
        //             return;
        //         }

        //         associatedEntity.x = bullet.x;
        //         associatedEntity.y = bullet.y;
        //         associatedEntity.rotation = bullet.rotation;
        //     });
        // }, 1000 / 60);


    }

    fire(mouseX: number, mouseY: number, bots: any ) {
        // Set on cooldown - will check soon
        // this.weaponSystem.fire()

        const bulletEntity = new BulletEntity(this.x, this.y, this.rotation +  1.57079633);
        this.nengiInstance.addEntity(bulletEntity);

        // We now have a bullet created, that has a link to the entity so we can update it easily
        const bulletGraphic = new BulletGraphicServer(this.scene, this.worldLayer, bulletEntity.nid, this.x, this.y, Phaser.Math.RadToDeg(this.rotation), bots, this.processBulletHit);
        this.bulletGraphics.set(bulletGraphic.associatedEntityId, bulletGraphic);

        setTimeout(() => {
            this.deleteBullet(bulletGraphic.associatedEntityId);
        }, 3000);

        // bulletGraphic.destroy()

        // Create entity

        return true;
    }

    deleteBullet = (entityId: number) => {
        const bulletEntity = this.nengiInstance.getEntity(entityId);

        if (!bulletEntity) {
            console.log("Trying to delete a bullet which doesn't exist any longer (may have already been cleared after collission)");
            return;
        }

        this.nengiInstance.removeEntity(bulletEntity);

        // Delete server copy
        const bullet = this.bulletGraphics.get(entityId);
        bullet.destroy();
        this.bulletGraphics.delete(bullet.associatedEntityId);

    }

    processBulletHit = (bullet: any, hitObj: any) => {
        console.log(`Bullet hit an object ${bullet.associatedEntityId} hit zombie ${hitObj.name}`);

        if (hitObj.type === "BOT") {
            hitObj.takeDamage(bullet.associatedEntityId);
        }

        this.deleteBullet(bullet.associatedEntityId);
    }

    processMove = (command: any) => {

        this.rotation = command.rotation;

        const speed = this.speed * command.delta * 10;
        // const prevVelocity = this.body.velocity.clone();

        // Stop any previous movement from the last frame
        this.setVelocity(0);

        // Horizontal movement
        if (command.left) {
            this.setVelocityX(-speed);
        } else if (command.right) {
            this.setVelocityX(speed);
        }

        // Vertical movement
        if (command.forward) {
            this.setVelocityY(-speed);
        }
        if (command.backward) {
            this.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        // this.body.velocity.normalize().scale(speed);


    }

    preUpdate() {
        this.bulletGraphics.forEach((bullet) => {
            const associatedEntity = this.nengiInstance.getEntity(bullet.associatedEntityId);

            if (!associatedEntity) {
                console.log("Trying to update positions of bullet graphic, but cannot find an entity");
                return;
            }

            associatedEntity.x = bullet.x;
            associatedEntity.y = bullet.y;
            associatedEntity.rotation = bullet.rotation;
        });
    }

    public takeDamage(damagerEntityId: number) {
        this.health -= 10;


        // TODO create correct event system soon?
        if (this.health <= 0) {
            console.log("Human killed :(")
            // return this.deathCallback(damagerEntityId, this.associatedEntityId);
        }

        // TODO - send a message to this client with their health

        console.log(`bot ${this.name} new health ${this.health}`);
    }
}
