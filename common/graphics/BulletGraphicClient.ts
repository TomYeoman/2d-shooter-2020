export default class BulletGraphicClient extends Phaser.GameObjects.Rectangle  {

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
    ) {

        super(scene, x, y, 5, 5, 0xfff)
    }
}
