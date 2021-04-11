import BotGraphicServer from "./BotGraphicServer";
import Phaser from "phaser";

export default class BulletGraphicServer extends Phaser.Physics.Arcade.Sprite{

    // sprite: Phaser.Physics.Arcade.Sprite

    rotation:number = 0

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

        // this.sprite = scene.physics.add
            // .sprite(startX, startY, "zombie")
            // .setSize(50, 50)
            // .setCircle(25);

        super(scene, startX, startY, "bullet");
        this.name = "bullet"

        scene.add.existing(this);

        scene.physics.add.existing(this);


        this.setSize(10, 20)
        this.setDisplaySize(10, 20)

        // this.body.setMass(0.1)
        // this.body.set
        // this.body.setSize(25, 25)

        this.associatedEntityId = associatedEntityId;
        scene.physics.add.collider(this, worldLayer, cb);
        this.body.immovable = true

        // super(scene, startX, startY, 5, 5, 0x9966ff)
        // this.setStrokeStyle(4, 0xefc53f)
        // scene.add.existing(this)
        // scene.physics.add.existing(this);

        // this.associatedEntityId = associatedEntityId

        // console.log(angle)
        const vec = scene.physics.velocityFromAngle(angle, 250);

        this.setVelocityX(vec.x);
        this.setVelocityY(vec.y);

        // Hacky way to fix our (rotate extra 90 degree) sprite, until we edit :)
        this.rotation = Phaser.Math.DegToRad(angle) + 1.57079633

        bots.forEach((bot: any) => {
            scene.physics.add.collider(this, bot, cb);
        });
    }

    preUpdate = () => {
        // console.log("Running pre-update")
    }

}
