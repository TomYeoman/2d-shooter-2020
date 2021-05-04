import BotGraphicServer from "./BotGraphicServer";
import Phaser from "phaser";


// class Bullets extends Phaser.Physics.Arcade.Group {
//     constructor(world, scene, config) {
//       super(
//         world,
//         scene,
//         Phaser.Utils.Objects.Merge(
//           {
//             classType: Bullet,
//             createCallback: Bullets.prototype.onCreate
//           },
//           config
//         )
//       );

//       console.assert(this.classType === Bullet);
//     }

//     fire(x, y, vx, vy) {
//       const bullet = this.getFirstDead(false);

//       if (bullet) {
//         bullet.fire(x, y, vx, vy);
//       }
//     }

//     onCreate(bullet) {
//       bullet.onCreate();
//     }

//     poolInfo() {
//       return `${this.name} ${this.getLength()} (${this.countActive(
//         true
//       )}:${this.countActive(false)})`;
//     }
//   }


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


    onCreate() {
        this.disableBody(true, true);
        // this.body.collideWorldBounds = true;
        // this.body.onWorldBounds = true;
    }

    preUpdate = () => {
        // console.log("Running pre-update")
    }


    public removeColliders() {
        // console.log(`Removing ${this.colliders.length} colliders`)
        // this.colliders.forEach((c) => {
        //     this.scene.physics.world.removeCollider(c)
        // })
        // this.disableBody(true, true)
    }

}
