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

        // TODO - Delete all old entities ( Might be things other than player in lobby )

        console.log(`Spawning player into level one`)
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
            setTimeout(() => {
                // TODO - Maybe allow the player to broadcast they have
                // Loaded the level, rather than pushing them over
                this.connectClient(client.name, client)
            }, 1000)

        })

        setInterval(() => {
            this.handleInputs()
        }, 1000 / nengiConfig.UPDATE_RATE);
    }

    // Phaser event tick - use for physics etc
    update() {
        // console.log("Level one Update")
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

                if (command.protocol.name === commandTypes.REQUEST_JOIN_GAME) {

                    // TODO - TIDY THIS UP, should be a generic message which sends a player to a level
                    this.nengiInstance.message(new LobbyStateMessage(lobbyState.IN_PROGRESS,"",  SCENE_NAMES.LEVEL_ONE, 0, 0), client)

                    // Give player time to move to level
                    setTimeout(() => {
                        this.connectClient(command.name, client)
                    }, 1000)

                } else {
                    this.processClientCommand(command,client)
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

            if (command.protocol.name === 'MoveCommand') {
                entitySelf.processMove(command)
            }

            this.nengiInstance.clients.forEach((client, index )=> {
                // console.log("Updating client ", index)
                client.view.x = entitySelf.x
                client.view.y = entitySelf.y
            })

        } else {
            console.log("level one - Trying to process commands on a player entity, which doesn't exist")
        }

    }

}