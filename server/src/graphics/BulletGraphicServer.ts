import BotGraphicServer from "./BotGraphicServer";
import Phaser from "phaser";

export default class BulletGraphicServer extends Phaser.Physics.Arcade.Sprite{
    rotation: number = 0
    colliders:any[] = []


    constructor(
        scene: Phaser.Scene,
        worldLayer: Phaser.Tilemaps.StaticTilemapLayer,

        public associatedEntityId: number,
        startX: number,
        startY: number,
        angle: number,
        bots: BotGraphicServer[],
        cb: any
    ) {

        super(scene, startX, startY, "bullet");
        this.type = "BULLET";

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setSize(10, 20)
        this.setDisplaySize(10, 20)

        this.colliders.push(this.scene.physics.add.collider(this, worldLayer, cb))
        this.body.immovable = true

        const vec = scene.physics.velocityFromAngle(angle, 250);

        this.setVelocityX(vec.x);
        this.setVelocityY(vec.y);

        // Hacky way to fix our (rotate extra 90 degree) sprite, until we edit :)
        this.rotation = Phaser.Math.DegToRad(angle) + 1.57079633

        bots.forEach((bot: any) => {
            this.colliders.push(this.scene.physics.add.collider(this, bot, cb))
        });
    }

    preUpdate = () => {
        // console.log("Running pre-update")
    }


    public removeColliders() {
        console.log(`Removing ${this.colliders.length} colliders`)
        this.colliders.forEach((c) => {
            this.scene.physics.world.removeCollider(c)
        })
    }

}
