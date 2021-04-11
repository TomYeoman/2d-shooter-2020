import PlayerGraphicServer from "../graphics/PlayerGraphicServer";
import {config} from "../config/zombie_config";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import NetLog from "../../../common/message/NetLog";
import ZombieWaveMessage from "../../../common/message/ZombieWaveMessage";
import BotGraphicServer from "../graphics/BotGraphicServer";
import BotEntity from "../../../common/entity/BotEntity";
import EasyStar from "easystarjs";

export class BotSystem {

    currentWave = 1
    waveSize = 0
    spawnedInWave = 0
    waveType = "normal"
    gameState = "running"
    currentDifficulty = 0
    killedZombies = 0

    spawnRate = config.zombies.spawnRate
    maxCount = config.zombies.maxCount
    botGraphicsMap:  Map<number, BotGraphicServer> = new Map();
    finder: any;

    hudUpdateTimer: NodeJS.Timer

    // spawns = []
    constructor(
        private scene: Phaser.Scene,
        private map: Phaser.Tilemaps.Tilemap,
        private worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        private tileset: Phaser.Tilemaps.Tileset,

        private nengiInstance: ExtendedNengiTypes.Instance,
        private playerGraphicsMap:  Map<number, PlayerGraphicServer>,
    ) {
    }

    beginGame = async () => {

        this.initialisePathing();

        switch (this.currentWave) {
            // TODO Add cool logic in future
            case 1: {
                this.waveType = "normal";
            }
            default: {
                this.waveType = "normal";
            }
        }

        this.hudUpdateTimer = setInterval(() => {
            this.sendWaveHudUpdates();
        }, 1000)

        // start the countdown
        await this.waveCountdown();

        this.startRegularWave();

    }

    private startRegularWave = async() => {

        this.gameState = "running";

        this.waveSize = this.getWaveSize(this.currentWave, this.waveType);

        // TODO - add code to revive any dead players
        // scripts\players\_players::spawnJoinQueue();

        // Start announcing the wave after the countdown
        // this.preWave(wavetype, type);

        const waveTimer = setInterval(() => {

            if (this.spawnedInWave < this.waveSize) {
                // If there's currently less bots that the max allowed
                if (this.spawnedInWave < this.maxCount) {
                    this.trySpawnZombie("normal", "spawn" );
                }

            } else {
                console.log("Finished spawning all zombies for round - clearing timer");
                clearTimeout(waveTimer)
            }
        }, config.zombies.spawnRate * 1000);

        // Our death callback will register kills, and eventually re-trigger this
        // once we've killed all zombies

    }

    /**
    *	Prepares gameplay environment depending on the type of wave
    *	@wavetype: String, defines the type of wave ("normal", "special" or "finale")
    *	@type: String, the type of specialwave-zombies that appear
    */

    private preWave = () => {
        return false;
    }

    private sendWaveHudUpdates() {
        this.nengiInstance.clients.forEach(client => {
            this.nengiInstance.message(new ZombieWaveMessage(
                this.currentWave,
                this.waveSize,
                this.spawnedInWave - this.killedZombies,
                this.playerGraphicsMap.size,
                this.playerGraphicsMap.size,
                this.gameState
            ), client);
        });
    }

    private trySpawnZombie = (zomType: string, spawnType: string) => {

        const spawnName = this.getSpawn()
        console.log(`Trying to spawn zombie at ${spawnName}`)
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === spawnName);

        console.log("Spawning bot");
        // Create a new entity for nengi to track
        const entityBot = new BotEntity(spawnPoint.x, spawnPoint.y);
        this.nengiInstance.addEntity(entityBot);

        // Create a new phaser bot and link to entity, we'll apply physics to for each path check
        console.log("about to create graphic");
        const botGraphic = new BotGraphicServer(this.scene, this.worldLayer, entityBot.nid, entityBot.x, entityBot.y, this.botGraphicsMap, this.playerGraphicsMap, this.finder, "", this.onBotDeath, this.onCollideWithEnemy);
        console.log("created graphic");
        this.botGraphicsMap.set(entityBot.nid, botGraphic);

        console.log(`Spawned in wave ${ this.spawnedInWave}`)
        this.spawnedInWave++

    }

    private onCollideWithEnemy = (zombie: BotGraphicServer, enemy: PlayerGraphicServer) => {
        // console.log(`Zombie chomped on human ${enemy.associatedEntityId}`);

        // TODO - Pass zombie type
        enemy.takeDamage(zombie.associatedEntityId)
        // if (hitObj.type === "BOT") {
        //     hitObj.takeDamage(bullet.associatedEntityId);
        // }

        // this.deleteBullet(bullet.associatedEntityId);
    }

    private initialisePathing = () => {

        console.log("Setting up pathfinding for level one");
        try {

            // SETUP PATHFINDING
            this.finder = new EasyStar.js();
            // this.finder.enableDiagonals();
            this.finder.enableCornerCutting();

            const getTileID = (x: number, y: number) => {
                // console.log(`${x}, ${y}`);
                const tile = this.map.getTileAt(x, y);
                return tile.index;
            };

            const grid = [];
            for (let y = 0; y < this.map.height; y++) {
                const col = [];
                for (let x = 0; x < this.map.width; x++) {
                    // In each cell we store the ID of the tile, which corresponds
                    // to its index in the tileset of the map (`ID" field in Tiled)`
                    col.push(getTileID(x, y));
                }
                grid.push(col);
            }

            this.finder.setGrid(grid);
            // this.finder.setIterati.onsPerCalculation(1000);

            const tilepaths = this.map.tilesets[0];
            const properties: any = this.tileset.tileProperties;

            const acceptableTiles = [];

            for (let i = tilepaths.firstgid - 1; i < this.tileset.total; i++) { // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
                // acceptableTiles.push(i + 1);

                if (!properties.hasOwnProperty(i)) {
                    // If there is no property indicated at all, it means it's a walkable tile
                    acceptableTiles.push(i+1);
                    continue;
                }

                console.log(properties[i]);
                if(!properties[i].collides) acceptableTiles.push(i+1);
                // if(properties[i].cost) Game.finder.setTileCost(i+1, properties[i].cost); // If there is a cost attached to the tile, let's register it
            }

            this.finder.setAcceptableTiles(acceptableTiles);
        } catch (e) {
            console.log(e);
        }
    }

    private getSpawn() {

        const possibleSpawns = ["zombie_spawn_1", "zombie_spawn_2"];
        let chosenSpawn = "zombie_spawn_1";
        // 70% chance to pick priority spawn, otherwise just pick any other random
        if (Math.random() * 100 < 70) {
            chosenSpawn = possibleSpawns[0];
        } else {
            chosenSpawn= possibleSpawns[1];
        }

        console.log(`Using spawn ${chosenSpawn}`);
        return chosenSpawn;

        // if (prioritySpawn) {
        //     // Spawn from priority point
        // }

        // // Else choose random
    }

    // TODO every so often we'll set a "priority spawn" to create hordes
    private rotatePrioritySpawn() {
        const possibleSpawns = ["zombie_spawn_1", "zombie_spawn_2"];
    }

    private getWaveSize(currentWave: number, waveType: string) {

        // return 10
        return (config.zombies.initialAmount + this.playerGraphicsMap.size) *
            ((this.currentWave * config.zombies.perWave) + config.zombies.perPlayer);

            // 1 = (10 + 10) * ((1 * 5) + 5) = 200
            // 2 = (10 + 10) * ((2 * 5) + 5) = 200
            // 3 = (10 + 10) * ((3 * 5) + 5) = 200

    }

    private async waveCountdown() {
        return new Promise((resolve, reject) => {
            // TODO add fancy countdown
            switch (this.waveType) {
                case "normal": {

                }

                default: {}
            }

            // Just send log and start game a few seconds after for now
            this.nengiInstance.clients.forEach(client => {
                this.nengiInstance.message(new NetLog(`Starting wave in ${config.zombies.timeoutBetweenWave} seconds`), client);
            });
            console.log("Starting wave now");

            setTimeout(() => {
                console.log("Starting wave now");
                resolve("");
            }, config.zombies.timeoutBetweenWave * 1000);

        });

    }

    onBotDeath = (killerEntityId: number, botEntityId: number): any => {
        // console.log("Method not implemented")

        console.log(`Bot ${botEntityId} was killed by ${killerEntityId} , removing from level`);

        // Remove nengi entity
        const botEntity = this.nengiInstance.getEntity(botEntityId);
        this.nengiInstance.removeEntity(botEntity);

        // Delete phaser representation

        const bot = this.botGraphicsMap.get(botEntityId);
        if (!bot) {
            throw new Error("Couldn't find the killed bots phaser entity");
        }

        bot.destroy();
        this.botGraphicsMap.delete(bot.associatedEntityId);

        this.killedZombies++

        if (this.killedZombies == this.waveSize) {
            this.endRound()
        }
    }

    endRound = async() => {

        // Clear down all wave based times
        this.spawnedInWave = 0;
        this.killedZombies = 0
        this.waveSize = 0;

        if (this.currentWave === config.zombies.maxRounds) {
            // Todo implement
        }

        // Run intermission
        this.gameState = "intermission";
        await this.waveCountdown();

        // Setup ready for next game
        // clearTimeout(this.hudUpdateTimer)
        this.currentWave++

        this.startRegularWave()
    }

    // Emit a message every X time, containing information on the current game state
    // survivorsHUD() {

    // }

    // updateWaveHud(killed:number, total: number) {
    //     return level.waveHUD_Killed + "/" +  level.waveHUD_Total, "ui_waveprogress", level.waveHUD_Killed / level.waveHUD_Total)
    // }


    pathBots = () => {

        let isReadyToPath = false;
        let target: any;

        this.nengiInstance.clients.forEach((client) => {

            const entitySelf = client.entitySelf;
            if (!entitySelf) {
                console.log("No clients to path find to yet");
            } else {
                isReadyToPath = true;
                target = client;
            }
        });

        if (isReadyToPath) {
            this.botGraphicsMap.forEach((bot: BotGraphicServer, index) => {
                bot.moveToPlayer(target.entitySelf.x, target.entitySelf.y);

                // Update over the wire entity, with phasers rending of it
                const associatedNengiEntity = this.nengiInstance.getEntity(bot.associatedEntityId);

                if (associatedNengiEntity) {
                    // console.log(`Found associated nengi entity, sending phaser position over X${ bot.sprite.x}, Y:${ bot.sprite.y}`)
                    associatedNengiEntity.x = bot.x;
                    associatedNengiEntity.y = bot.y;

                    associatedNengiEntity.rotation = Math.atan2(target.entitySelf.y - bot.y, target.entitySelf.x - bot.x);
                }
            });
        }

    }
}