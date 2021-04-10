export default class PlayerGraphicClient extends Phaser.GameObjects.Sprite  {

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
    ) {
        super(scene, x, y, "player")
        this.scale = 0.3
    }
}
