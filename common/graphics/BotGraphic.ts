import EasyStar from "easystarjs"

export class Bot {
    scene: Phaser.Scene
    speed: number
    entityId: number
    sprite: Phaser.Physics.Arcade.Sprite
    x = 0
    y = 0
    playerType = ""
    finder: EasyStar.js
    tickCount = 0

    constructor(
        scene: Phaser.Scene,
        entityId: number,
        x: number,
        y: number,
        bots: Bot[],
        finder: EasyStar.js
    ) {

        function randomIntFromInterval(min:number, max:number) { // min and max included
          return Math.floor(Math.random() * (max - min + 1) + min);
        }

        this.finder = finder

        this.speed = randomIntFromInterval(10, 50)
        this.entityId = entityId
        this.sprite = scene.physics.add
            .sprite(x, y, "player")
            // .setSize(50, 50)
            .setCircle(25);

        this.sprite.body.bounce.x = 1
        this.sprite.body.setMass(100)

        this.scene = scene

        // this.scene.physics.add.collider(this.sprite, worldLayer);

        bots.forEach((bot) => {
            scene.physics.add.collider(this.sprite, bot.sprite);
        })



    }

    public moveBot(nextPath: { x: number, y: number }) {

        // this.sprite.setVelocityX(0)
        // this.sprite.setVelocityX(0)

        let nextPathTileX = nextPath.x
        let nextPathTileY = nextPath.y
        let currBotTileX = Math.floor(this.sprite.x / 32)
        let currBotTileY = Math.floor(this.sprite.y / 32)

        // console.log(`Recieved path of X${nextPathTileX}, Y: ${nextPathTileX}, SpriteX: ${currBotTileX}, SpriteY: ${currBotTileY}`)
        if (nextPathTileX > currBotTileX) {
            this.sprite.setVelocityX(this.speed)
        }

        if (nextPathTileX < currBotTileX) {
            this.sprite.setVelocityX(-this.speed)
        }

        if (nextPathTileY > currBotTileY) {
            this.sprite.setVelocityY(this.speed)
        }

        if (nextPathTileY < currBotTileY) {
            this.sprite.setVelocityY(-this.speed)
        }
    }

    public moveToPlayer(targetX: number, targetY: number) {

        // 10% chance of actually re-calculating path per frame
        if (Math.random() < 0.2) {
            let fromX = Math.floor(this.sprite.x /32)
            let fromY = Math.floor(this.sprite.y / 32)

            // console.log(`Bot ${index} Pathing to player at ${clientID} at X:${toX}, Y: ${toY}`)

            this.finder.findPath(fromX,fromY, targetX, targetY, (path: any) => {
                if (path === null) {
                    console.warn("Path was not found.");
                } else {
                    // console.log(`Moving to X:${path[0].x}, Y:${path[0].y + 32}`)
                    if (path.length) {
                        // console.log(path)
                        this.moveBot(path[1])

                }

                }
            });

            this.finder.calculate();
        }

    }

}


