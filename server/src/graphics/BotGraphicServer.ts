import EasyStar from "easystarjs";
import PlayerGraphicServer from "./PlayerGraphicServer";

export default class BotGraphicServer extends Phaser.Physics.Arcade.Sprite {
    speed: number
    associatedEntityId: number
    playerType = ""
    finder: EasyStar.js
    tickCount = 0
    name: string
    type: string
    health = 100
    deathCallback: (killerEntityId: number, botEntityId: number) => {}

    constructor(
        scene: Phaser.Scene,
        worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        associatedEntityId: number,
        startX: number,
        startY: number,
        botGraphics: Map<number, BotGraphicServer>,
        playerGraphics: Map<number, PlayerGraphicServer>,
        finder: EasyStar.js,
        name: string,
        deathCallback: (killerEntityId: number, botEntityId: number) => {},
        // onCollideWithEnemy: (zombie: BotGraphicServer, enemy: PlayerGraphicServer) => {}
        onCollideWithEnemy: any
    ) {

        super(scene, startX, startY, "zombie");
        scene.add.existing(this);
        scene.physics.add.existing(this);
        scene.physics.add.collider(this, worldLayer);

        // Commom Graphics Info
        this.name = name;
        this.type = "BOT";

        this.deathCallback = deathCallback;

        // this.setSize(100,100);

        // this.setDisplaySize(100,100);

        this.setSize(50, 50);
        this.setDisplaySize(50, 50);

        // this.setCircle(15)

        function randomIntFromInterval(min: number, max: number) { // min and max included
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        this.finder = finder;
        this.speed = randomIntFromInterval(100, 100);
        this.associatedEntityId = associatedEntityId;

        // this.body.bounce.set(0.1, 0.1);

        // this.body.setMass(0.1);
        // this.body.pushable = true
        // this.body.immovable = true


        botGraphics.forEach((bot) => {
            scene.physics.add.collider(this, bot);
        });

        playerGraphics.forEach((bot) => {
            scene.physics.add.collider(this, bot, onCollideWithEnemy);
        });

    }

    public moveBot(nextPath: { x: number; y: number }) {

        // this.setVelocityX(0)
        // this.setVelocityX(0)

        const nextPathTileX = nextPath.x;
        const nextPathTileY = nextPath.y;
        const currBotTileX = Math.floor(this.x / 32);
        const currBotTileY = Math.floor(this.y / 32);

        // console.log(`Recieved path of X${nextPathTileX}, Y: ${nextPathTileX}, SpriteX: ${currBotTileX}, SpriteY: ${currBotTileY}`)
        if (nextPathTileX > currBotTileX) {
            this.setVelocityX(this.speed);
        }

        if (nextPathTileX < currBotTileX) {
            this.setVelocityX(-this.speed);
        }

        if (nextPathTileY > currBotTileY) {
            this.setVelocityY(this.speed);
        }

        if (nextPathTileY < currBotTileY) {
            this.setVelocityY(-this.speed);
        }
    }

    public moveToPlayer(targetX: number, targetY: number) {

        const txcopy = targetX;
        const tycopy = targetY;
        const targetXDistance = Math.abs(txcopy - this.x);
        const targetYDistance = Math.abs(tycopy - this.y);

        // console.log(`Target X ${targetXDistance}, Target Y ${targetYDistance}`);
        // Turn off path finding when close enough
        if (targetXDistance < 100 && targetYDistance < 100) {

            // console.log("Zombie switching to brute find");
            if (targetX > this.x) {

                this.setVelocityX(this.speed);
            } else {

                this.setVelocityX(-this.speed);
            }

            if (targetY > this.y) {
                this.setVelocityY(this.speed);
            } else {
                this.setVelocityY(-this.speed);
            }

        } else {

            // 10% chance of actually re-calculating path per frame
            if (Math.random() < 0.05) {
                const fromX = Math.floor(this.x / 32);
                const fromY = Math.floor(this.y / 32);

                // console.log(`Bot ${index} Pathing to player at ${clientID} at X:${toX}, Y: ${toY}`)

                this.finder.findPath(fromX, fromY, Math.floor(targetX / 32), Math.floor(targetY / 32), (path: any) => {
                    if (path === null) {
                        console.warn("Path was not found.");
                    } else {
                        // console.log(`Moving to X:${path[0].x}, Y:${path[0].y + 32}`)
                        if (path.length) {
                            // console.log(path)
                            this.moveBot(path[1]);
                        }

                    }
                });

                this.finder.calculate();
            }

        }

        this.rotation = Math.atan2(targetX - this.y, targetY - this.x);


    }

    public takeDamage(damagerEntityId: number) {
        this.health -= 200;


        // TODO create correct event system soon?
        if (this.health <= 0) {
            // console.log("Bot killed")
            return this.deathCallback(damagerEntityId, this.associatedEntityId);
        }

        console.log(`bot ${this.name} new health ${this.health}`);
    }

    public markForGC() {
        this.speed = undefined
        this.associatedEntityId = undefined
        this.playerType = undefined
        this.finder = undefined
        this.tickCount = undefined
        this.name = undefined
        this.type= undefined
        this.health = undefined
        this.deathCallback = undefined

    }
}


