import EasyStar from "easystarjs"

export default class BotGraphicServer extends Phaser.Physics.Arcade.Sprite{
    speed: number
    associatedEntityId: number
    playerType = ""
    finder: EasyStar.js
    tickCount = 0
    name: string
    type: string
    health: number = 100
    deathCallback : (killerEntityId:number, botEntityId: number) => {}

    constructor(
        scene: Phaser.Scene,
        associatedEntityId: number,
        startX: number,
        startY: number,
        bots: Map<number, BotGraphicServer>,
        finder: EasyStar.js,
        name: string,
        deathCallback: (killerEntityId:number, botEntityId: number) => {}
    ) {

        super(scene, startX, startY, "zombie")
        scene.add.existing(this)
        scene.physics.add.existing(this)

        // Commom Graphics Info
        this.name = name
        this.type = "BOT"

        this.deathCallback = deathCallback

        this.setCircle(10)

        function randomIntFromInterval(min:number, max:number) { // min and max included
          return Math.floor(Math.random() * (max - min + 1) + min);
        }

        this.finder = finder
        this.speed = randomIntFromInterval(10, 50)
        this.associatedEntityId = associatedEntityId

        // this.body.bounce.x = 1
        // this.body.setMass(100)

        bots.forEach((bot) => {
            scene.physics.add.collider(this, bot);
        })

    }

    public moveBot(nextPath: { x: number, y: number }) {

        // this.setVelocityX(0)
        // this.setVelocityX(0)

        let nextPathTileX = nextPath.x
        let nextPathTileY = nextPath.y
        let currBotTileX = Math.floor(this.x / 32)
        let currBotTileY = Math.floor(this.y / 32)

        // console.log(`Recieved path of X${nextPathTileX}, Y: ${nextPathTileX}, SpriteX: ${currBotTileX}, SpriteY: ${currBotTileY}`)
        if (nextPathTileX > currBotTileX) {
            this.setVelocityX(this.speed)
        }

        if (nextPathTileX < currBotTileX) {
            this.setVelocityX(-this.speed)
        }

        if (nextPathTileY > currBotTileY) {
            this.setVelocityY(this.speed)
        }

        if (nextPathTileY < currBotTileY) {
            this.setVelocityY(-this.speed)
        }
    }

    public moveToPlayer(targetX: number, targetY: number) {

        // 10% chance of actually re-calculating path per frame
        if (Math.random() < 0.05) {
            let fromX = Math.floor(this.x /32)
            let fromY = Math.floor(this.y / 32)

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

    public takeDamage(damagerEntityId: number) {
        this.health -= 25


        // TODO create correct event system soon?
        if (this.health <= 0) {
            // console.log("Bot killed")
            return this.deathCallback(damagerEntityId, this.associatedEntityId)
        }

        console.log(`bot ${this.name} new health ${this.health}`)
    }
}


