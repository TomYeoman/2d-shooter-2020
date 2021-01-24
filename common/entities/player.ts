import { ClientInputPacket, Entities, EntityEnum, PositionBuffer } from "../types/types";

export class Player {

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
        this.speed = 2000
        this.entity_id = entityId

        this.sprite = scene.physics.add
            .sprite(x, y, "atlas", "misa-front")
            .setSize(30, 40)
        // .setOffset(0, 24);

        this.playerType = playerType
        // var r2 = scene.add.rectangle(400, 150, 148, 148, 0x9966ff).setStrokeStyle(4, 0xefc53f);

        // scene.physics.add.existing(r2);

        // r2.body.velocity.x = 100;
        // r2.body.velocity.y = 100;

        scene.physics.add.collider(this.sprite, worldLayer);

        for (const [key, entity] of Object.entries(entities)) {
            scene.physics.add.collider(this.sprite, entity.sprite);
        }


    }

    // Apply user's input to this entity.

    public generateBotMovement() {
        this.sprite.setVelocityX(Math.random() * 50);
        this.sprite.setVelocityY(Math.random() * 50);
    }

    public applyInput(input: ClientInputPacket) {
        if (input.left) {
            this.frameVelocityX += (-input.press_time * this.speed);
        } else if (input.right) {
            this.frameVelocityX += (input.press_time * this.speed);
        }
        if (input.up) {
            this.frameVelocityY += (-input.press_time * this.speed);
        } else if (input.down) {
            this.frameVelocityY += (input.press_time * this.speed);
        }
    }

    public setVelocity() {
        this.sprite.setVelocityX(this.frameVelocityX);
        this.sprite.setVelocityY(this.frameVelocityY);
    }

    public resetVelocity() {
        this.frameVelocityX = 0;
        this.frameVelocityY = 0;
        this.sprite.setVelocity(0, 0);
    }

}
