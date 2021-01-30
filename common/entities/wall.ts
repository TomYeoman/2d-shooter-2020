import { Entities, EntityEnum, PositionBuffer } from '../types/types'
import { v4 as uuidv4 } from "uuid";
import Phaser from "phaser";

export class Wall {
    sprite: Phaser.Physics.Arcade.Sprite
    // sprite: Phaser.Physics.Arcade.Image

    type= EntityEnum.WALL
    position_buffer: PositionBuffer[] = [];
    entity_id: string = "WALL-" + uuidv4()

    constructor(scene: Phaser.Scene, entities: Entities, x:number, y:number) {
        // this.sprite = scene.add.rectangle(x, y, 148, 148, 0x6666ff);
        // scene.physics.add.existing(this.sprite, true);

        this.sprite = scene.physics.add
            .sprite(x, y, "player")
            .setSize(100, 100)

        // Collide with every other entity - optimise any only add player as collision?

        // this.sprite.setImmovable(true)
        for (const [key, entity] of Object.entries(entities)) {
            scene.physics.add.overlap(this.sprite, entity.sprite, (ob1) => {
                // debugger
                // console.log(ob1.body.overlapX)
                // console.log(ob1.body.overlapY)
                // console.log(ob2.body.overlapX)
                // console.log(ob2.body.overlapY)
            });
        }

        console.log(entities)

        // this.sprite.setVelocityX(100)

        // this.sprite.setVelocityX(100)

    }

    update() {
        this.sprite.x += 1
        // this.sprite.setVelocityX(100)

        // this.sprite.setVelocityX(100)
        // console.log(this.sprite.body.position.x)
        // console.log(this.sprite.body.position.y)
        // console.log(this.sprite.body)
        // for (const [key, entity] of Object.entries(entities)) {
        //     scene.physics.add.collider(this.sprite, entity.sprite);
        // }

    }
    updateClient() {
        // this.sprite.setVelocity(1)
        // this.sprite.setVelocityX(100)

        // this.sprite.setVelocityX(100)
        // console.log(this.sprite.body.position.x)
        // console.log(this.sprite.body.position.y)
        // console.log(this.sprite.body)
        // for (const [key, entity] of Object.entries(entities)) {
        //     scene.physics.add.collider(this.sprite, entity.sprite);
        // }

    }

}
