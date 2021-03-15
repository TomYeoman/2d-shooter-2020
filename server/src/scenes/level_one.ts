// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { commandTypes } from "../../../common/types/types";
import nengiConfig from "../../../common/nengiconfig";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import PlayerCharacter from "../../../common/entity/PlayerCharacter";
import Identity from "../../../common/message/Identity";
import nengi from "nengi";

export default class LevelOne extends Phaser.Scene {

    // Server
    private nengiInstance: ExtendedNengiTypes.Instance;

    // Connected clients and their entities.
    clients: { [key: string]: any } = {};
    entities: Map<string, any>

    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap

    preload() {
        const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", "minigame_1.json");

        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON("map", mapPath);
    }

    create({ nengiInstance }: { nengiInstance: ExtendedNengiTypes.Instance }) {

        console.log("Running create level one");

        // Map
        this.nengiInstance = nengiInstance

        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
        this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });

        // Nengi - Re-configure ready to handle connections etc on this level.
        this.nengiInstance.onConnect((client, data, callback) => {
            // TODO - Put in waiting area
            callback({ accepted: true, text: 'Welcome to level one!' })
        })


        this.nengiInstance.onDisconnect((client:any) => {
            this.nengiInstance.emit('disconnect', client)

            // If we're tracking an entity for the disconnected player
            // then remove it
            if (client.entitySelf) {
            console.log(`Player ${client.entitySelf.nid} disconnected from level-one, deleting entity`)
                this.nengiInstance.removeEntity(client.entitySelf)
            } else {
                console.log("Player disconnected, but had no entity to clear up")
            }

        })


        console.log(`Spawning player into level one`)

        this.nengiInstance.clients.forEach(client => {
            const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");
            const entitySelf = new PlayerCharacter(spawnPoint.x, spawnPoint.y)
            this.nengiInstance.addEntity(entitySelf)

            // tell the client which entities it controls
            this.nengiInstance.message(new Identity(entitySelf.nid), client)

            // Update self, to be new version in level
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
                this.processClientCommand(command,client)
            }

        }
        this.nengiInstance.update()
    }

    processClientCommand(command: any, client: any) {
        if (client.entitySelf) {

            const entitySelf = client.entitySelf

            if (command.protocol.name === 'MoveCommand') {
                entitySelf.processMove(command)
            }

            this.nengiInstance.clients.forEach(client => {
                client.view.x = entitySelf.x
                client.view.y = entitySelf.y
            })

        } else {
            console.log("level one - Trying to process commands on a player entity, which doesn't exist")
        }

    }

}