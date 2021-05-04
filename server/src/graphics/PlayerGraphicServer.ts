import WeaponSystem from "../../../common/modules/WeaponSystem";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Phaser from "phaser";
import BotGraphicServer from "./BotGraphicServer";
import BulletGraphicServer from "./BulletGraphicServer";
import BulletEntity from "../../../common/entity/BulletEntity";
import ClientHudMessage from "../../../common/message/ClientHudMessage";
import { Bullet, Bullets } from "./BulletsNew";
import { BotSystem } from "../systems/BotSystem";
import { Bot } from "./BotGraphicNew";

export default class PlayerGraphicServer extends Phaser.Physics.Arcade.Sprite{

    weaponSystem: WeaponSystem
    rotation = 0
    speed: number
    bulletGraphics: Map<number, BulletGraphicServer>
    health = 100
    totalBullets = 0

    bullets: Bullets

    constructor(
        scene: Phaser.Scene,
        private worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        private nengiInstance: ExtendedNengiTypes.Instance,
        private client: ExtendedNengiTypes.Client,
        xStart: number,
        yStart: number,
        public associatedEntityId: number,
        private botSystem?: BotSystem
    ) {

        super(scene, xStart, yStart, "player");
        this.bulletGraphics = new Map();

        this.bullets = this.scene.add.existing(
            new Bullets(this.nengiInstance, this.scene.physics.world, this.scene, { name: "bullets" })
        ) as unknown as Bullets;

        this.bullets.createMultiple({
            key: "bullet",
            quantity: 500,
            active: false,
            visible: false,
          });

        this.scene.physics.add.collider(this.bullets, this.worldLayer, (bullet: Bullet, enemy: Bullet) => {
            console.log("bullet hit a world layer object")
            bullet.disableBody(true, true);
            this.deleteBullet(bullet.associatedEntityId)

        });

        if (this.botSystem) {
              this.scene.physics.add.overlap(this.bullets, this.botSystem.bots, (bullet: Bullet, zombie: Bot) => {
                console.log("bullet hit a zombie")
                bullet.disableBody(true, true);
                this.deleteBullet(bullet.associatedEntityId)

                zombie.takeDamage(bullet.associatedEntityId);

              });

              this.scene.physics.add.overlap(this, this.botSystem.bots, (PlayerGraphicServer: Bullet, zombie: Bot) => {
                console.log("zombie hit a player")

                // zombie.takeDamage(bullet.associatedEntityId);

            });

        }




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

        if (this.weaponSystem.fire()) {
            this.bullets.fire(this.x, this.y, Phaser.Math.RadToDeg(this.rotation), bots);
        }

        // We now have a bullet created, that has a link to the entity so we can update it easily
        // const bulletGraphic = new BulletGraphicServer(this.scene, this.worldLayer, bulletEntity.nid, this.x, this.y, Phaser.Math.RadToDeg(this.rotation), bots, this.processBulletHit);
        // this.bulletGraphics.set(bulletGraphic.associatedEntityId, bulletGraphic);

        // // Debug bullet creation lag
        // this.totalBullets++
        // console.log(this.totalBullets)

        // setTimeout(() => {
        //     this.deleteBullet(bulletGraphic.associatedEntityId);
        // }, 3000);
    }

    deleteBullet = (entityId: number) => {

        // console.log(`Deleting bullet with ID ${entityId}`)

        const bulletEntity = this.nengiInstance.getEntity(entityId);

        if (!bulletEntity) {
            // console.log("Trying to delete a bullet which doesn't exist any longer (may have already been cleared after collission)");
            return;
        }

        this.nengiInstance.removeEntity(bulletEntity);

        // // Delete server copy
        // let bullet = this.bulletGraphics.get(entityId);

        // // CALL THIS FIRST TO IMPROVE PERFORMANCE
        // // bullet.removeColliders()
        // bullet.disableBody(true, true)
        // bullet.destroy(false);

        // this.bulletGraphics.delete(entityId);
        // console.log(this.bulletGraphics.size)

    }

    // processBulletHit = (bullet: any, hitObj: any) => {
    //     // console.log(`Bullet hit an object ${bullet.associatedEntityId} hit zombie ${hitObj.name}`);

    //     if (hitObj.type === "BOT") {
    //         hitObj.takeDamage(bullet.associatedEntityId);
    //     }

    //     this.deleteBullet(bullet.associatedEntityId);
    // }

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

        // console.log(this.bullets.poolInfo())

        this.bullets.getChildren().forEach((bullet: any) => {

            if (bullet.active) {
                // console.log(`Updating position for ${bullet.associatedEntityId}`)

                const associatedEntity = this.nengiInstance.getEntity(bullet.associatedEntityId);

                if (!associatedEntity) {
                    // console.log("Trying to update positions of bullet graphic, but cannot find an entity");
                    return;
                }

                associatedEntity.x = bullet.x;
                associatedEntity.y = bullet.y;
                associatedEntity.rotation = bullet.rotation;
            }

        })

    //     });
    // }

    // public takeDamage(damagerEntityId: number) {
    //     this.health -= 0.1;

    //     // TODO create correct event system soon?
    //     if (this.health <= 0) {
    //         console.log("Human killed :(")
    //         return this.deathCallback(damagerEntityId, this.associatedEntityId);
    //     }
    }
}
