import BotGraphicServer from './BotGraphicServer'
import Phaser from "phaser"

export default class BulletGraphicServer extends Phaser.Physics.Arcade.Sprite{

    // sprite: Phaser.Physics.Arcade.Sprite

    constructor(
        scene: Phaser.Scene,
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

        super(scene, startX, startY, "zombie")
        scene.add.existing(this)
        scene.physics.add.existing(this)
        // this.setSize(25, 25)
        this.setCircle(2)


        this.associatedEntityId = associatedEntityId


        // super(scene, startX, startY, 5, 5, 0x9966ff)
        // this.setStrokeStyle(4, 0xefc53f)
        // scene.add.existing(this)
        // scene.physics.add.existing(this);

        // this.associatedEntityId = associatedEntityId


        const vec = scene.physics.velocityFromAngle(angle, 250)

        this.setVelocityX(vec.x)
        this.setVelocityY(vec.y)

        bots.forEach((bot: any) => {
            scene.physics.add.collider(this, bot, cb);
        })
    }

    preUpdate = () => {
        // console.log("Running pre-update")
    }

}
