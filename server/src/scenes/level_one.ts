// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { commandTypes, lobbyState, SCENE_NAMES } from "../../../common/types/types";
import nengiConfig from "../../../common/config/nengiConfig";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import FireCommand from "../../../common/command/FireCommand";
import PlayerEntity from "../../../common/entity/PlayerEntity";
import PlayerGraphicServer from "../graphics/PlayerGraphicServer";
import Identity from "../../../common/message/Identity";
import nengi from "nengi";
import RequestJoinGame from "../../../common/command/RequestJoinGame";
import EasyStar from "easystarjs";
import BotGraphicServer from "../graphics/BotGraphicServer";
import BotEntity from "../../../common/entity/BotEntity";
import { BotSystem } from "../systems/BotSystem";
/*
When we start a new level, we need to

- Move over all current clients
    - They will already have an entity, which we need to delete
    - Create them an entity in the new level, and inform client of their new ID

- When a new player joins the game
    - Create them an entity, and inform them of their entity ID

*/
export default class LevelOne extends Phaser.Scene {

    // Server
    private nengiInstance: ExtendedNengiTypes.Instance;
    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap
    tileset: Phaser.Tilemaps.Tileset
    // AI
    finder: any;


    playerGraphics: Map<number, PlayerGraphicServer>
    // botGraphics: Map<number, BotGraphicServer>

    botSystem: BotSystem


    // ------------ SETUP ------------//
    levelName = "zm_castle";


    preload() {
        const imgPath = path.join("", __dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", `${this.levelName}.json`);

        const survivorShotgunPath = path.join(__dirname, "..", "assets", "survivor-shotgun.png");
        const bulletPath = path.join(__dirname, "..", "assets", "bullet.png");
        const zombiePath = path.join(__dirname, "..", "assets", "zombie.png");

        this.load.image("zombie", zombiePath);
        this.load.image("player", survivorShotgunPath);
        this.load.image("bullet", bulletPath);

        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON(this.levelName, mapPath);

        console.log("LOADING NEW MAP");
    }

    create({ nengiInstance }: { nengiInstance: ExtendedNengiTypes.Instance }) {

        console.log("Running create level one");

        // Map
        this.nengiInstance = nengiInstance;
        this.playerGraphics = new Map();
        // this.botGraphics = new Map();


        this.map = this.make.tilemap({ key: this.levelName });

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
        // Phaser's cache (i.e. the name you used in preload)
        this.tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        // const belowLayer = this.map.createStaticLayer("Below Player", tileset, 0, 0);

        this.worldLayer = this.map.createStaticLayer("LevelOneWorld", this.tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });


        console.log("Spawning players into level one");
        this.nengiInstance.clients.forEach(client => {
            // Client was already created in main lobby, and we therefore need to delete
            // the old entity
            if (client.entitySelf) {
                console.log(`Removing lobby entity from client ${client.entitySelf.nid}`);
                // Remove our lobby entity, it's no longer needed
                this.nengiInstance.removeEntity(client.entitySelf);
                client.entitySelf = null;

            }
        });

        this.nengiInstance.onDisconnect((client: any) => {
            console.log("disconnected in level-one", client.id);
            // this.nengiInstance.emit('disconnected in level-one', client)
            if (client.entitySelf && client.entityPhaser) {
                console.log(`Player ${client.entitySelf.nid} disconnected from level-one, clearing down entities`);
                this.nengiInstance.removeEntity(client.entitySelf);

                // Delete server copy
                const player = this.playerGraphics.get(client.entityPhaser.associatedEntityId);
                player.destroy();
                this.playerGraphics.delete(client.entityPhaser.associatedEntityId);

            } else {
                console.log("Player disconnected from level one, but was unable to find either the entity, or the entity phaser");
            }
        });


        this.botSystem = new BotSystem(this, this.map, this.worldLayer, this.tileset, this.nengiInstance, this.playerGraphics);
        this.botSystem.beginGame();

        // console.log(spawnPoint.x);
        // console.log(spawnPoint.y);
        // for (let index = 0; index < 2; index++) {

        //     console.log("Spawning bot");
        //     // Create a new entity for nengi to track
        //     const entityBot = new BotEntity(spawnPoint.x, spawnPoint.y);
        //     this.nengiInstance.addEntity(entityBot);

        //     // Create a new phaser bot and link to entity, we'll apply physics to for each path check
        //     console.log("about to creat grahpic");
        //     const botGraphic = new BotGraphicServer(this, this.worldLayer, entityBot.nid, entityBot.x, entityBot.y, this.botGraphics, this.finder, index.toString(), this.onBotDeath);
        //     console.log("created graphic");
        //     this.botGraphics.set(entityBot.nid, botGraphic);
        // }

        setInterval(() => {
            this.handleInputs();
        }, 1000 / nengiConfig.UPDATE_RATE);


    }

    // onBotDeath = (killerEntityId: number, botEntityId: number): any => {
    //     // console.log("Method not implemented")

    //     console.log(`Bot ${botEntityId} was killed by ${killerEntityId} , removing from level`);

    //     // Remove nengi entity
    //     const botEntity = this.nengiInstance.getEntity(botEntityId);
    //     this.nengiInstance.removeEntity(botEntity);

    //     // Delete phaser representation

    //     const bot = this.botGraphics.get(botEntityId);
    //     if (!bot) {
    //         throw new Error("Couldn't find the killed bots phaser entity");
    //     }

    //     bot.destroy();
    //     this.botGraphics.delete(bot.associatedEntityId);
    // }

    // ------------ MAIN LOOP ------------//
    update() {

        // let target: any;
        // let isReadyToPath = false;

        // // TODO find closest client instead
        // this.nengiInstance.clients.forEach((client) => {

        //     const entitySelf = client.entitySelf;
        //     if (!entitySelf) {
        //         console.log("No clients to path find to yet");
        //     } else {
        //         isReadyToPath = true;
        //         target = client;
        //     }
        // });

        // if (isReadyToPath) {
        //     this.botGraphics.forEach((bot: BotGraphicServer, index) => {
        //         bot.moveToPlayer(target.entitySelf.x, target.entitySelf.y);

        //         // Update over the wire entity, with phasers rending of it
        //         const associatedNengiEntity = this.nengiInstance.getEntity(bot.associatedEntityId);

        //         if (associatedNengiEntity) {
        //             // console.log(`Found associated nengi entity, sending phaser position over X${ bot.sprite.x}, Y:${ bot.sprite.y}`)
        //             associatedNengiEntity.x = bot.x;
        //             associatedNengiEntity.y = bot.y;

        //             associatedNengiEntity.rotation = Math.atan2(target.entitySelf.y - bot.y, target.entitySelf.x - bot.x);
        //         }
        //     });
        // }

        this.botSystem.pathBots();


    }

    // ------------ INPUT HANDLING ------------//
    handleInputs() {
        // this.nengiInstance.emitCommands()
        /* serverside logic can go here */

        let cmd = null;
        while (cmd = this.nengiInstance.getNextCommand()) {
            const tick = cmd.tick;
            const client = cmd.client;

            for (let i = 0; i < cmd.commands.length; i++) {
                const command = cmd.commands[i];

                // console.log(`Level one - Processing command ${command.protocol.name}`)
                switch (command.protocol.name) {
                    // First a client asks about game info, so they are able to change their scene
                    case commandTypes.REQUEST_GAME_INFO:
                        // TODO - TIDY THIS UP, should be a generic message which sends a player to a level

                        client.name = command.name;
                        console.log("A client requested game info");
                        this.nengiInstance.message(new LobbyStateMessage(lobbyState.IN_PROGRESS, "", SCENE_NAMES.LEVEL_ONE, 0, 0), client);
                        break;

                    // Once they have actually loaded the level, they will request to join current game
                    case commandTypes.REQUEST_SPAWN:
                        console.log("Spawning player into level (creating entity for them");
                        this.commandRequestSpawn(client.name, client);
                        break;

                    case commandTypes.MOVE_COMMAND:
                        // console.log("Player trying to move")
                        this.commandMove(command, client);
                        break;
                    case commandTypes.FIRE_COMMAND:
                        this.commandFire(command, client);
                        break;
                    default:
                        console.log(`Unrecognised command ${command.protocol.name} for ${client.name}`);
                }

            }

        }
        this.nengiInstance.update();
    }

    commandRequestSpawn(clientName: string, client: any) {

        // Re-create the new player entity
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "human_spawn_point");

        const entitySelf = new PlayerEntity(spawnPoint.x, spawnPoint.y);
        this.nengiInstance.addEntity(entitySelf);

        // Create a new phaser bot and link to entity, we'll apply physics to for each path check
        const playerGraphic = new PlayerGraphicServer(this, this.worldLayer, this.nengiInstance, entitySelf.x, entitySelf.y, entitySelf.nid);
        this.playerGraphics.set(entitySelf.nid, playerGraphic);

        // Tell the client about the new entity ID they now control for this level
        this.nengiInstance.message(new Identity(entitySelf.nid), client);

        // Update self, to be new version in level
        entitySelf.client = client;
        client.entitySelf = entitySelf;
        client.entityPhaser = playerGraphic;

        client.positions = [];
        client.name = clientName;
        client.positions = [];

        // define the view (the area of the game visible to this client, all else is culled)
        client.view = {
            x: entitySelf.x,
            y: entitySelf.y,
            halfWidth: 99999,
            halfHeight: 99999
        };
    }




    commandMove(command: any, client: any) {
        if (client.entitySelf && client.entityPhaser) {

            const clientEntityPhaser: PlayerGraphicServer = client.entityPhaser;
            const clientEntitySelf: PlayerEntity = client.entitySelf;

            // Process move on phaser, and sync with entity
            clientEntityPhaser.processMove(command);
            clientEntitySelf.x = clientEntityPhaser.x;
            clientEntitySelf.y = clientEntityPhaser.y;
            clientEntitySelf.rotation = clientEntityPhaser.rotation;

            // Update player views
            this.nengiInstance.clients.forEach((client, index) => {
                client.view.x = clientEntityPhaser.x;
                client.view.y = clientEntityPhaser.y;
            });
        } else {
            console.log("level one - Trying to process commands on a player entity, which doesn't exist");
        }

    }

    commandFire(command: FireCommand, client: any) {

        if (client.entitySelf && client.entityPhaser) {
            // Whilst we send ID@s of entity over the wire, we need to call phaser on the server
            const clientEntityPhaser: PlayerGraphicServer = client.entityPhaser;
            clientEntityPhaser.fire(
                command.mouseX,
                command.mouseY,
                this.botSystem.botGraphicsMap,
            );
        }
    }

}