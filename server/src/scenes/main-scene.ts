// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import nengi from 'nengi'
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import NetLog from "../../../common/message/NetLog";
import PlayerCharacter from "../../../common/entity/PlayerCharacter";
import Identity from "../../../common/message/Identity";
import nengiConfig from '../../../common/config/nengiConfig'
import { update } from "lodash";
import { LobbyManager } from "../game/LobbyManager";
import { commandTypes, messageTypes } from "../../../common/types/types";

export default class MainScene extends Phaser.Scene {

    // Server
    private nengiInstance: ExtendedNengiTypes.Instance;

    // Connected clients and their entities.
    clients: { [key: string]: any } = {};
    entities: Map<string, any>

    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap
    lobby: LobbyManager

    inputHandlerTimer ?: any

    preload() {

        const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", "spawn_island.json");
        // const mapPath = path.join(__dirname, "..", "assets", "first_map.json");

        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON("map", mapPath);
    }


    init() {
        console.log("Running init");
        try {
            // @ts-ignore
            const { nengiInstance } = this.game.config.preBoot();
            this.nengiInstance = nengiInstance

        } catch (e) {
            console.log("Error extracting preBoot data", e);
        }

    }

    create() {

        console.log("Running create");
        // this.listen();

        this.map = this.make.tilemap({ key: "map" });
        this.entities = new Map()

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
        // Phaser's cache (i.e. the name you used in preload)
        const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        const belowLayer = this.map.createStaticLayer("Below Player", tileset, 0, 0);
        this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });


        // Nengi - Perhaps extract?
        this.nengiInstance.onConnect((client, data, callback) => {
            callback({ accepted: true, text: 'Welcome!' })
        })

        this.nengiInstance.onDisconnect(client => {
            // this.nengiInstance.emit('disconnect', client)

            if (client.entitySelf) {
                console.log(`Player ${client.entitySelf.nid} disconnected from main-scene, clearing down entities`)
                this.nengiInstance.removeEntity(client.entitySelf)
            } else {
                console.log("Player disconnected, but had no entity to clear up")
            }

        })

        // Handle client inputs / sending game state every 20 ticks (default), versus physics phaser running @ closer to 60 FPS (default)
        this.inputHandlerTimer = setInterval(() => {
            this.handleInputs()
        }, 1000 / nengiConfig.UPDATE_RATE);

        // Create a single lobby for now
        this.lobby = new LobbyManager(this, this.nengiInstance, this.map, this.inputHandlerTimer)

    }

    // Phaser event tick - use for physics etc
    update() {

    }

    handleInputs() {
        // console.log("Main 1 handle update")
        // this.nengiInstance.emitCommands()
        /* serverside logic can go here */

        let cmd = null
        while (cmd = this.nengiInstance.getNextCommand()) {
            const tick = cmd.tick
            const client = cmd.client

            for (let i = 0; i < cmd.commands.length; i++) {
                const command = cmd.commands[i]

                // console.log(`Main - Processing command ${command.protocol.name}`)

                if (command.protocol.name === commandTypes.REQUEST_GAME_INFO) {
                    console.log("Trying to process request game")
                    this.lobby.connectClient(command, client)
                } else {
                    this.lobby.processClientCommand(command,client)
                }
            }

        }

        this.nengiInstance.update()
    }

}