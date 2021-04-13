import WeaponSystem from "../../../common/modules/WeaponSystem";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Phaser from "phaser";
import BotGraphicServer from "./BotGraphicServer";
import BulletGraphicServer from "./BulletGraphicServer";
import BulletEntity from "../../../common/entity/BulletEntity";
import ClientHudMessage from "../../../common/message/ClientHudMessage";

export default class PlayerGraphicServer extends Phaser.Physics.Arcade.Sprite{

    weaponSystem: WeaponSystem
    rotation = 0
    speed: number
    bulletGraphics: Map<number, BulletGraphicServer>
    health = 100
    totalBullets = 0

    constructor(
        scene: Phaser.Scene,
        private worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        private nengiInstance: ExtendedNengiTypes.Instance,
        private client: ExtendedNengiTypes.Client,
        xStart: number,
        yStart: number,
        public associatedEntityId: number
    ) {


        super(scene, xStart, yStart, "player");
        this.bulletGraphics = new Map();
        this.speed = 1000;

        this.weaponSystem = new WeaponSystem();
        this.associatedEntityId = associatedEntityId;


        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setSize(50,50)
        this.setDisplaySize(50, 50)

        console.log("Setting up collision with world");
        scene.physics.add.collider(this, worldLayer);
        this.body.immovable = true

        setInterval(() => {
            this.updateHud()
        }, 200)
    }

    // Sent message to the client who owns this player, with their player information
    updateHud() {
        this.nengiInstance.message(new ClientHudMessage(
            this.health,
            "~",
            "Shredder",
        ), this.client);
    }

    fire(bots: any ) {
        // Set on cooldown - will check soon
        // this.weaponSystem.fire()

        const bulletEntity = new BulletEntity(this.x, this.y, this.rotation +  1.57079633);
        this.nengiInstance.addEntity(bulletEntity);

        // We now have a bullet created, that has a link to the entity so we can update it easily
        const bulletGraphic = new BulletGraphicServer(this.scene, this.worldLayer, bulletEntity.nid, this.x, this.y, Phaser.Math.RadToDeg(this.rotation), bots, this.processBulletHit);
        this.bulletGraphics.set(bulletGraphic.associatedEntityId, bulletGraphic);

        // Debug bullet creation lag
        this.totalBullets++
        console.log(this.totalBullets)

        setTimeout(() => {
            this.deleteBullet(bulletGraphic.associatedEntityId);
        }, 3000);
    }

    deleteBullet = (entityId: number) => {
        const bulletEntity = this.nengiInstance.getEntity(entityId);

        if (!bulletEntity) {
            // console.log("Trying to delete a bullet which doesn't exist any longer (may have already been cleared after collission)");
            return;
        }

        this.nengiInstance.removeEntity(bulletEntity);

        // Delete server copy
        let bullet = this.bulletGraphics.get(entityId);

        // CALL THIS FIRST TO IMPROVE PERFORMANCE
        bullet.removeColliders()
        bullet.destroy(false);

        this.bulletGraphics.delete(entityId);
        console.log(this.bulletGraphics.size)

    }

    processBulletHit = (bullet: any, hitObj: any) => {
        // console.log(`Bullet hit an object ${bullet.associatedEntityId} hit zombie ${hitObj.name}`);

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

    // Update the entity, with the local positions of all bullets this player has
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
        this.health -= 0.1;

        // TODO create correct event system soon?
        if (this.health <= 0) {
            // console.log("Human killed :(")
            // return this.deathCallback(damagerEntityId, this.associatedEntityId);
        }
    }
}
