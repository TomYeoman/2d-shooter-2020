// import { Scene } from "phaser";
import { ClientInputPacket, Entities, EntityEnum, PositionBuffer } from "../types/types";

export class Player {

    scene: Phaser.Scene
    speed: number
    position_buffer: PositionBuffer[] = [];
    entity_id: string
    sprite: Phaser.Physics.Arcade.Sprite
    type = EntityEnum.PLAYER

    frameVelocityX = 0
    frameVelocityY = 0

    // todo As an optimisation, just reference player.x as "obj.x" in future
    x = 0
    y = 0
    playerType = ""

    constructor(
        scene: Phaser.Scene,
        worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        entityId: string,
        x: number,
        y: number,
        playerType: "bot" | "player",
        entities: Entities
    ) {
        this.speed = 200
        this.entity_id = entityId
        this.sprite = scene.physics.add
            .sprite(x, y, "atlas", "misa-front")
            .setSize(30, 40)
        // .setOffset(0, 24);
        this.playerType = playerType
        this.scene = scene

        // var r2 = scene.add.rectangle(400, 150, 148, 148, 0x9966ff).setStrokeStyle(4, 0xefc53f);

        // scene.physics.add.existing(r2);

        // r2.body.velocity.x = 100;
        // r2.body.velocity.y = 100;

        this.scene.physics.add.collider(this.sprite, worldLayer);

        for (const [key, entity] of Object.entries(entities)) {
            scene.physics.add.collider(this.sprite, entity.sprite);
        }


    }

    // Apply user's input to this entity.

    // public generateBotMovement() {
    //     this.sprite.setVelocityX(Math.random() * 50);
    //     this.sprite.setVelocityY(Math.random() * 50);
    // }

    public applyInput(input: ClientInputPacket) {
        if (input.left) {
            this.sprite.x += -input.press_time * this.speed
            // this.frameVelocityX += (-input.press_time * this.speed);
        } else if (input.right) {
            this.sprite.x += input.press_time * this.speed
            // this.frameVelocityX += (input.press_time * this.speed);
        }
        if (input.up) {
            this.sprite.y += -input.press_time * this.speed
            // this.frameVelocityY += (-input.press_time * this.speed);
        } else if (input.down) {
            this.sprite.y += input.press_time * this.speed
            // this.frameVelocityY += (input.press_time * this.speed);
        }

        // this.sprite.setVelocityX(50)

        // console.log(this.sprite.body.x)
        // this.sprite.setVelocityX(5);
        // this.sprite.setVelocityY(5);
    }

    public processMove(entities: Entities) {
        for (const [key, entity] of Object.entries(entities)) {
            if (entity.type === "wall") {

                this.scene.physics.overlap(this.sprite, entity.sprite, (ob1:any, ob2:any) => {
                    // debugger
                    console.log(ob1.body.overlapX)
                    // console.log("xxx")
                    console.log(ob1.body.overlapY)
                    console.log(ob2.body.overlapX)
                    console.log(ob2.body.overlapY)

                    // if (Math.abs(ob2.body.overlapX) > (entity.sprite.height/2)) {
                        // this.sprite.x += ob2.body.overlapX
                    // } else {
                        this.sprite.x -= ob2.body.overlapX
                    // }
                    // this.sprite.y -= ob2.body.overlapY
                    // ob2.body.clear()

                });

            }
            // console.log(entity.type)
        }
    }


    public setVelocity() {
        // this.sprite.setVelocityX(this.frameVelocityX);
        // this.sprite.setVelocityY(this.frameVelocityY);
    }

    public resetVelocity() {
        // this.frameVelocityX = 0;
        // this.frameVelocityY = 0;
        // this.sprite.setVelocity(0, 0);
    }

}
