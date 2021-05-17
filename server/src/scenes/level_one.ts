// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { CLIENT_SCENE_STATE, commandTypes, lobbyState, SCENE_NAMES } from "../../../common/types/types";
import nengiConfig from "../../../common/config/nengiConfig";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import FireCommand from "../../../common/command/FireCommand";
import PlayerEntity from "../../../common/entity/PlayerEntity";
import PlayerGraphicServer from "../graphics/PlayerGraphicServer";
import Identity from "../../../common/message/Identity";
import { BotSystem } from "../systems/BotSystem";
import ClientStateMessage from "../../../common/message/ClientStateMessage";
import ToolbarUpdatedMessage from "../../../common/message/ToolbarUpdatedMessage";
import { PlayerSystem } from "../systems/PlayerSystem";
import ModifyToolbarCommand from "../../../common/command/ModifyToolbarCommand";
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
    playerSystem: PlayerSystem


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


        // Initialise player system
        this.playerSystem = new PlayerSystem(this, this.map, this.worldLayer, this.nengiInstance);

        // Initialise bot system
        this.botSystem = new BotSystem(this, this.map, this.worldLayer, this.tileset, this.nengiInstance, this.playerSystem);

        // Tell player system about the bot sprite pool
        this.playerSystem.botSystem = this.botSystem

        // Lets start the game
        this.botSystem.beginGame();

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
            this.playerSystem.deletePlayer(client)
        });


        setInterval(() => {
            this.handleInputs();
        }, 1000 / nengiConfig.UPDATE_RATE);


    }


    // ------------ MAIN LOOP ------------//
    update() {

        this.botSystem.updateBots();


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
                        console.log("Creating initial client information - lobby will spawn player when needed");
                        this.commandRequestSpawn(client.name, client);
                        break;

                    case commandTypes.MOVE_COMMAND:
                        // console.log("Player trying to move")
                        this.commandMove(command, client);
                        break;
                    case commandTypes.FIRE_COMMAND:
                        this.commandFire(command, client);
                        break;
                    case commandTypes.MODIFY_TOOLBAR_COMMAND:
                        this.commandModifyToolbar(command, client);
                        break;
                    default:
                        console.log(`Unrecognised command ${command.protocol.name} for ${client.name}`);
                }

            }

        }
        this.nengiInstance.update();
    }

    commandRequestSpawn(clientName: string, client: ExtendedNengiTypes.Client) {

        client.name = clientName;
        client.isAlive = false

        // TODO - maybe assign a scene / instance to client?

        // this.playerSystem.createPlayer(client)
        this.nengiInstance.message(new ClientStateMessage(CLIENT_SCENE_STATE.DEAD), client);

    }

    commandMove(command: any, client: ExtendedNengiTypes.Client) {
        this.playerSystem.movePlayer(command, client)
    }


    commandFire(command: FireCommand, client: any) {

        if (client.entitySelf && client.entityPhaser) {
            // Whilst we send ID@s of entity over the wire, we need to call phaser on the server
            const clientEntityPhaser: PlayerGraphicServer = client.entityPhaser;
            clientEntityPhaser.fire();
        }
    }

    commandModifyToolbar(command: ModifyToolbarCommand, client: ExtendedNengiTypes.Client) {

        if (client.entitySelf && client.entityPhaser) {
            console.log({ selectedSlot: command.selectedSlot })
            client.selectedSlot = command.selectedSlot

            this.nengiInstance.message(new ToolbarUpdatedMessage(command.selectedSlot, ""), client);

        }
    }


}