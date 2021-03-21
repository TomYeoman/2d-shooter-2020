export class PlayerGraphic {

    scene: Phaser.Scene
    sprite: Phaser.Physics.Arcade.Sprite

    x = 0
    y = 0

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
    ) {
        this.sprite = scene.physics.add
        .sprite(x, y, "player")
        // .setSize(200, 200)
        .setCircle(100, 100)
        .setOffset(25, 25)

        this.sprite.scale = 0.3
        // var r1 = scene.add.rectangle(200, 150, 148, 148, 0x6666ff);
        // scene.physics.add.existing(r1);

        this.scene = scene
    }
}
