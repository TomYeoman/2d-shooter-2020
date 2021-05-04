import EasyStar from "easystarjs";
import BotEntity from "../../../common/entity/BotEntity";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import PlayerGraphicServer from "./PlayerGraphicServer";

type deathCallback = (killerEntityId: number, botEntityId: number) => {}

export class Bots extends Phaser.Physics.Arcade.Group {
    constructor(
        private nengiInstance: ExtendedNengiTypes.Instance,
        private deathCallback: deathCallback,
        world: any,
        scene: any,
        config: any
    ) {

        super(
            world,
            scene,
            Phaser.Utils.Objects.Merge(
                {
                    classType: Bot,
                    createCallback: Bots.prototype.onCreate
                },
                config
            )
        );

        console.assert(this.classType === Bots);
    }

    spawnBot(
        startX: number,
        startY: number,
        playerGraphics: Map<number, PlayerGraphicServer>,
        finder: EasyStar.js
    ) {

        const bot = this.getFirstDead(false);

        if (bot) {

            console.log("Spawning bot as there's space")

            const entityBot = new BotEntity(startX, startY);
            this.nengiInstance.addEntity(entityBot);

            bot.spawnBot(
                entityBot.nid,
                startX,
                startY,
                playerGraphics,
                finder
            );
        } else {
            console.log("No zombie dead in pool, unable to spawn")
        }

    }

    onCreate(
        bot: Bot
    ) {
        console.log("Creating bot")
        bot.onCreate(
            this.deathCallback
        );
    }

    poolInfo() {
        return `${this.name} ${this.getLength()} (${this.countActive(
            true
        )}:${this.countActive(false)})`;
    }
}


export class Bot extends Phaser.Physics.Arcade.Sprite {
    speed: number
    associatedEntityId: number
    playerType = ""
    finder: EasyStar.js
    name: string
    type: string
    health = 100
    onDeathCallback: deathCallback
    playerGraphics: Map<number, PlayerGraphicServer>

    spawnBot(
        associatedEntityId: number,
        startX: number,
        startY: number,
        playerGraphics: Map<number, PlayerGraphicServer>,
        finder: EasyStar.js
    ) {

        this.enableBody(true, startX, startY, true, true);
        this.associatedEntityId = associatedEntityId
        this.playerGraphics = playerGraphics

        this.setSize(50, 50);
        this.setDisplaySize(50, 50);
        // this.setCircle(15)
        this.speed = randomIntFromInterval(100, 100);
        this.type = "BOT";
        // this.body.bounce.set(0.2, 0.2);
        // this.body.setMass(0.1);

        function randomIntFromInterval(min: number, max: number) { // min and max included
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        this.finder = finder;
        this.speed = randomIntFromInterval(100, 100);
    }

    onCreate(
        deathCallback: deathCallback
    ) {
        this.disableBody(true, true);
        // this.body.immovable = true
        this.onDeathCallback = deathCallback
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

    preUpdate() {
        let player: PlayerGraphicServer = this.playerGraphics.values().next().value
        if (!player) {
            console.log("Tried to move bot to a player we couldn't find")
        } else {
            this.moveToPlayer(player.x, player.y)
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
            if (Math.random() < 0.2) {
                const fromX = Math.floor(this.x / 32);
                const fromY = Math.floor(this.y / 32);

                // console.log(`Bot ${index} Pathing to player at ${clientID} at X:${toX}, Y: ${toY}`)

                try {
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
                } catch (e) {
                    // console.log(e)
                }

            }

        }

        this.rotation = Math.atan2(targetY - this.y, targetX - this.x);


    }


    public takeDamage(damagerEntityId: number) {
        this.health -= 200;


        // TODO create correct event system soon?
        if (this.health <= 0) {
            console.log("Bot killed")
            // return this.deathCallback(damagerEntityId, this.associatedEntityId);
            this.onDeathCallback(damagerEntityId, this.associatedEntityId)
            this.disableBody(true, true);
        }

        console.log(`bot ${this.name} new health ${this.health}`);

        // TODO clear movement timer?
    }

    public processDeath(damagerEntityId: number) {
        this.health -= 200;


        // TODO create correct event system soon?
        if (this.health <= 0) {
            console.log("Bot killed")
            // return this.deathCallback(damagerEntityId, this.associatedEntityId);
            this.disableBody(true, true);
        }

        console.log(`bot ${this.name} new health ${this.health}`);

        // TODO clear movement timer?
    }

}


