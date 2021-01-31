// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import nengi from 'nengi'
import { ExtendedNengiTypes } from "../../../common/custom-nengi-types";
import NetLog from "../../../common/NetLog";
import PlayerCharacter from "../../../common/entity/PlayerCharacter";
import Identity from "../../../common/Identity";
import nengiConfig from '../../../common/nengiconfig'
import { update } from "lodash";

export default class MainScene extends Phaser.Scene {

    // Server
    private nengiInstance: ExtendedNengiTypes.Instance;

    // Connected clients and their entities.
    clients: { [key: string]: any } = {};
    entities: Map<string, any>

    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap

    preload() {

        const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", "demo_map_v1.json");
        // const mapPath = path.join(__dirname, "..", "assets", "first_map.json");

        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON("map", mapPath);
    }

    constructor() {
        super("MainScene");

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

            // make the raw entity only visible to this client
            // const entitySelf = new PlayerCharacter()
            // const channel = this.nengiInstance.createChannel()
            // channel.subscribe(client)
            // channel.addEntity(entitySelf)
            // client.channel = channel

            const entitySelf = new PlayerCharacter()
            this.nengiInstance.addEntity(entitySelf)


            // tell the client which entities it controls
            this.nengiInstance.message(new Identity(entitySelf.nid), client)

            // establish a relation between this entity and the client
            entitySelf.client = client
            client.entitySelf = entitySelf

            client.positions = []

            // define the view (the area of the game visible to this client, all else is culled)
            client.view = {
                x: entitySelf.x,
                y: entitySelf.y,
                halfWidth: 99999,
                halfHeight: 99999
            }

            callback({ accepted: true, text: 'Welcome!' })

        })

        this.nengiInstance.onDisconnect(client => {
            this.nengiInstance.emit('disconnect', client)
        })

        // this.nengiInstance.emitCommands = () => {
        //     let cmd = null
        //     while (cmd = this.nengiInstance.getNextCommand()) {
        //         const tick = cmd.tick
        //         const client = cmd.client

        //         for (let i = 0; i < cmd.commands.length; i++) {
        //             const command = cmd.commands[i]
        //             this.nengiInstance.emit(`command::${command.protocol.name}`, { command, client, tick })
        //         }
        //     }
        // }


        this.nengiInstance.on('disconnect', client => {
            // this.entities.delete(client.entitySelf.nid)

            this.nengiInstance.removeEntity(client.entitySelf)
            // client.channel.destroy()

        })


        setInterval(() => {
            this.handleInputs()
        }, 1000 / nengiConfig.UPDATE_RATE);

    }

    // Phaser event tick - use for physics etc
    update() {

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
                const entitySelf = client.entitySelf

                if (command.protocol.name === 'MoveCommand') {
                    entitySelf.processMove(command)

                }
            }

        }

        this.nengiInstance.clients.forEach(client => {
            client.view.x = client.entitySelf.x
            client.view.y = client.entitySelf.y
        })

        this.nengiInstance.update()
    }

}