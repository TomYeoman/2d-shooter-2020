// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { commandTypes, lobbyState, SCENE_NAMES } from "../../../common/types/types";
import nengiConfig from "../../../common/config/nengiConfig";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import PlayerCharacter from "../../../common/entity/PlayerCharacter";
import Identity from "../../../common/message/Identity";
import nengi from "nengi";
import RequestJoinGame from "../../../common/command/RequestJoinGame";
import EasyStar from "easystarjs"
import {Bot} from '../../../common/graphics/BotGraphic'
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

    // Connected clients and their entities.
    // clients: { [key: string]: any } = {};
    // entities: Map<string, any>

    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap

    // AI
    finder: any;
    bots: Bot[] = [];

    preload() {
        const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", "minigame_1.json");
        const survivorShotgunPath = path.join(__dirname, "..", "assets", "survivor-shotgun.png");

        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON("map", mapPath);

        this.load.image("player", survivorShotgunPath);

        // this.load.atlas(
        //     "atlas",
        //     "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.png",
        //     "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json"
        //   );

    }

    create({ nengiInstance }: { nengiInstance: ExtendedNengiTypes.Instance }) {

        console.log("Running create level one");

        // Map
        this.nengiInstance = nengiInstance

        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
        this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });

        console.log(`Setting up pathfinding for level one`)

        // SETUP PATHFINDING
        this.finder = new EasyStar.js()
        this.finder.enableDiagonals()
        this.finder.enableCornerCutting()

        const getTileID = (x: number, y: number) => {
            var tile = this.map.getTileAt(x, y);
            return tile.index;
        };

        var grid = [];
        for (var y = 0; y < this.map.height; y++) {
            var col = [];
            for (var x = 0; x < this.map.width; x++) {
                // In each cell we store the ID of the tile, which corresponds
                // to its index in the tileset of the map ("ID" field in Tiled)
                col.push(getTileID(x, y));
            }
            grid.push(col);
        }

        this.finder.setGrid(grid);
        // this.finder.setIterationsPerCalculation(1000);

        let tilepaths = this.map.tilesets[0];
        let acceptableTiles = [];

        for (var i = tilepaths.firstgid - 1; i < tileset.total; i++) { // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
            acceptableTiles.push(i + 1)

            // if (!properties.hasOwnProperty(i)) {
            //     // If there is no property indicated at all, it means it's a walkable tile
            //     acceptableTiles.push(i+1);
            //     continue;
            // }
            // if(!properties[i].collide) acceptableTiles.push(i+1);
            // if(properties[i].cost) Game.finder.setTileCost(i+1, properties[i].cost); // If there is a cost attached to the tile, let's register it
        }

        this.finder.setAcceptableTiles(acceptableTiles)

        console.log(`Spawning players into level one`)
        this.nengiInstance.clients.forEach(client => {

            // Client was already created in main lobby, and we therefore need to delete
            // the old entity
            if (client.entitySelf) {
                console.log(`Removing lobby entity from client ${client.entitySelf.nid}`)
                // Remove our lobby entity, it's no longer needed
                this.nengiInstance.removeEntity(client.entitySelf)
                client.entitySelf = null

            }

            // Give player time to move to level
            // setTimeout(() => {
            //     // TODO - Maybe allow the player to broadcast they have
            //     // Loaded the level, rather than pushing them over
            //     this.connectClient(client.name, client)
            // }, 1000)

        })

        // Add some bots to the game
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");

        for (let index = 0; index < 10; index++) {

            // Create a new entity for nengi to track
            const entityBot = new PlayerCharacter(spawnPoint.x + Math.random() * 500, spawnPoint.y + Math.random() * 500)
            this.nengiInstance.addEntity(entityBot)

            // Create a new phaser bot and link to entity, we'll apply physics to for each path check
            const phaserBot = new Bot(this, entityBot.nid, spawnPoint.x + Math.random() * 500, spawnPoint.y + Math.random() * 500, this.bots, this.finder)
            this.bots.push(phaserBot)
        }

        setInterval(() => {
            this.handleInputs()
        }, 1000 / nengiConfig.UPDATE_RATE);


    }

    // Phaser event tick - use for physics etc
    update() {
        // For each bot, work out the path to get to a the player

        // Pick a random player

        // Grab first player info

        let target:any
        let isReadyToPath = false

        // TODO find closest client instead
        this.nengiInstance.clients.forEach((client) => {

            let entitySelf = client.entitySelf
            if (!entitySelf) {
                console.log("No clients to path find to yet")
            } else {
                isReadyToPath = true
                target = client
                // targetX = Math.floor(client.entitySelf.x/32)
                // targetY = Math.floor(client.entitySelf.y/32)
                // clientID = client.entitySelf.nid
            }
        })

        if (isReadyToPath) {
            this.bots.forEach((bot: Bot, index) => {
                bot.moveToPlayer(Math.floor(target.entitySelf.x/32), Math.floor((target.entitySelf.y/32)))

                // Update over the wire entity, with phasers rending of it
                let associatedNengiEntity = this.nengiInstance.getEntity(bot.entityId)

                if (associatedNengiEntity) {
                    // console.log(`Found associated nengi entity, sending phaser position over X${ bot.sprite.x}, Y:${ bot.sprite.y}`)
                    associatedNengiEntity.x = bot.sprite.x
                    associatedNengiEntity.y = bot.sprite.y

                    associatedNengiEntity.rotation = Math.atan2(target.entitySelf.y - bot.sprite.y, target.entitySelf.x - bot.sprite.x)
                }
            });
        }

    }

    handleInputs() {
        // this.nengiInstance.emitCommands()
        /* serverside logic can go here */

        let cmd = null
        while (cmd = this.nengiInstance.getNextCommand()) {
            const tick = cmd.tick
            const client = cmd.client

            for (let i = 0; i < cmd.commands.length; i++) {
                const command = cmd.commands[i]

                // console.log(`Level one - Processing command ${command.protocol.name}`)
                switch (command.protocol.name) {
                    // First a client asks about game info, so they are able to change their scene
                    case commandTypes.REQUEST_GAME_INFO:
                        // TODO - TIDY THIS UP, should be a generic message which sends a player to a level

                        client.name = command.name
                        console.log("A client requested game info")
                        this.nengiInstance.message(new LobbyStateMessage(lobbyState.IN_PROGRESS, "", SCENE_NAMES.LEVEL_ONE, 0, 0), client)
                        break;

                    // Once they have actually loaded the level, they will request to join current game
                    case commandTypes.REQUEST_SPAWN:
                        console.log("Spawning player into level (creating entity for them")
                        this.connectClient(client.name, client)
                        break;

                    case commandTypes.MOVE_COMMAND:
                        // console.log("Player trying to move")
                        this.processClientCommand(command, client)
                        break;
                    default:
                        console.log(`Unrecognised command ${command.protocol.name} for ${client.name}`)
                }

            }

        }
        this.nengiInstance.update()
    }

    connectClient(clientName: string, client: any) {

        // Re-create the new player entity
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");
        const entitySelf = new PlayerCharacter(spawnPoint.x, spawnPoint.y)
        this.nengiInstance.addEntity(entitySelf)

        // Tell the client about the new entity ID they now control for this level
        this.nengiInstance.message(new Identity(entitySelf.nid), client)

        // Update self, to be new version in level
        entitySelf.client = client
        client.entitySelf = entitySelf
        client.positions = []
        client.name = clientName
        client.positions = []

        // define the view (the area of the game visible to this client, all else is culled)
        client.view = {
            x: entitySelf.x,
            y: entitySelf.y,
            halfWidth: 99999,
            halfHeight: 99999
        }
    }


    processClientCommand(command: any, client: any) {

        // console.log(client.id)

        if (client.entitySelf) {

            const entitySelf = client.entitySelf

            if (command.protocol.name === commandTypes.MOVE_COMMAND) {
                entitySelf.processMove(command)
            }

            this.nengiInstance.clients.forEach((client, index) => {
                // console.log("Updating client ", index)
                client.view.x = entitySelf.x
                client.view.y = entitySelf.y
            })

        } else {
            console.log("level one - Trying to process commands on a player entity, which doesn't exist")
        }

    }

}