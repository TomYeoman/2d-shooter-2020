// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
const path = require("path");
import nengi from "nengi";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import nengiConfig from "../../../common/config/nengiConfig";
// import { LobbyManager } from "../game/LobbyManager";
import { commandTypes, lobbyState, messageTypes, SCENE_NAMES } from "../../../common/types/types";
import RequestJoinGame from "../../../common/command/RequestJoinGame";
import PlayerGraphicServer from "../graphics/PlayerGraphicServer";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import PlayerEntity from "../../../common/entity/PlayerEntity";
import Identity from "../../../common/message/Identity";

export default class MainScene extends Phaser.Scene {

    // Server
    private nengiInstance: ExtendedNengiTypes.Instance;

    // Connected clients and their entities.
    clients: { [key: string]: any } = {};
    entities: Map<string, any>

    worldLayer: Phaser.Tilemaps.StaticTilemapLayer
    map: Phaser.Tilemaps.Tilemap
    // lobby: LobbyManager

    inputHandlerTimer?: any

    gameMode = "This is a demo game"
    sceneName = "demo-scene"
    timeRemaining = -1
    state: lobbyState
    lobbyMinimum = 1
    phaserInstance: Phaser.Scene
    playerGraphics: Map<number, PlayerGraphicServer>
    hasGameStarted = false

    levelName = "spawn_island";


    preload() {

        const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
        const mapPath = path.join(__dirname, "..", "assets", `${this.levelName}.json`);
        // const mapPath = path.join(__dirname, "..", "assets", "first_map.json");
        const survivorShotgunPath = path.join(__dirname, "..", "assets", "survivor-shotgun.png");

        this.load.image("player", survivorShotgunPath);
        this.load.image("tiles", imgPath);
        this.load.tilemapTiledJSON(this.levelName, mapPath);
    }


    init() {
        console.log("Running init");
        try {
            // @ts-ignore
            const { nengiInstance } = this.game.config.preBoot();
            this.nengiInstance = nengiInstance;

        } catch (e) {
            console.log("Error extracting preBoot data", e);
        }

    }

    create() {

        this.entities = new Map();
        this.playerGraphics = new Map();


        console.log("Running create");

        console.log("Test")

        this.map = this.make.tilemap({ key: this.levelName });

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
        // Phaser's cache (i.e. the name you used in preload)
        const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        // const belowLayer = this.map.createStaticLayer("Below Player", tileset, 0, 0);

        this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
        this.worldLayer.setCollisionByProperty({ collides: true });


        // Nengi - Perhaps extract?
        this.nengiInstance.onConnect((client, data, callback) => {
            callback({ accepted: true, text: "Welcome!" });
        });

        this.nengiInstance.onDisconnect((client: any) => {
            console.log("disconnected in main-scene", client);

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

        // Handle client inputs / sending game state every 20 ticks (default), versus physics phaser running @ closer to 60 FPS (default)
        this.inputHandlerTimer = setInterval(() => {
            this.handleInputs();
        }, 1000 / nengiConfig.UPDATE_RATE);

        // // Create a single lobby for now
        // this.lobby = new LobbyManager(this, this.nengiInstance, this.map, this.inputHandlerTimer);

        this.state = lobbyState.WAITING_FOR_PLAYERS;

    }

    // Phaser event tick - use for physics etc
    update() {

    }

    handleInputs() {
        // console.log("Main 1 handle update")
        // this.nengiInstance.emitCommands()
        /* serverside logic can go here */

        let cmd = null;
        while (cmd = this.nengiInstance.getNextCommand()) {
            const tick = cmd.tick;
            const client = cmd.client;

            for (let i = 0; i < cmd.commands.length; i++) {
                const command = cmd.commands[i];

                // console.log(`Main - Processing command ${command.protocol.name}`)
                switch (command.protocol.name) {
                    // First a client asks about game info, so they are able to change their scene
                    case commandTypes.REQUEST_GAME_INFO:
                        console.log("Trying to process request game");
                        this.checkGameIsReadyToBegin(command, client);
                        break;
                    case commandTypes.MOVE_COMMAND:
                        // console.log("Player trying to move")
                        this.processClientCommand(command, client);
                        break;

                    default:
                        console.log(`Unrecognised command ${command.protocol.name} for ${client.name}`);
                }

            }

        }

        this.nengiInstance.update();
    }


    checkGameIsReadyToBegin(command: RequestJoinGame, client: any) {
        const playerCount = this.nengiInstance.clients.toArray().length;
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");

        console.log(`Checking whether game is ready to start with ${playerCount} players, and ${this.lobbyMinimum} minimum`);

        if (playerCount >= this.lobbyMinimum && !this.hasGameStarted) {
            console.log("Lobby now full, starting game in 5 seconds");

            // We should update lobby event, to tell when to transition
            // this.hasGameStarted = true

            // setTimeout(() => {
            console.log("Beginning game");

            this.state = lobbyState.IN_PROGRESS;
            // Choose scene (would be dynamic in future)
            this.sceneName = SCENE_NAMES.LEVEL_ONE;

            // Broadcast game start, and scene change to all clients
            this.nengiInstance.clients.forEach(client => {

                console.log("Moving client ");
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.sceneName, playerCount, this.lobbyMinimum), client);

                clearInterval(this.inputHandlerTimer);
            });

            this.scene.sleep(SCENE_NAMES.MAIN);

            // Run our minigame of choice, passing in nengi
            this.scene.run(this.sceneName, { nengiInstance: this.nengiInstance });

            // }, 3000)

        } else {
            console.log("Spawning player into lobby until game starts");

            // Put them into waiting area, with a player count
            // TODO - If game hasn't started, we should tell everyone when somenew new joins
            this.nengiInstance.clients.forEach(client => {
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.sceneName, playerCount, this.lobbyMinimum), client);
            });

            const entitySelf = new PlayerEntity(spawnPoint.x, spawnPoint.y);
            this.nengiInstance.addEntity(entitySelf);

            // Create a new phaser bot and link to entity, we'll apply physics to for each path check
            const playerGraphic = new PlayerGraphicServer(this, this.worldLayer, this.nengiInstance, client, entitySelf.x, entitySelf.y, entitySelf.nid, this.deathCallback);
            this.playerGraphics.set(entitySelf.nid, playerGraphic);

            // Tell the client about the new entity ID they now control for this level
            this.nengiInstance.message(new Identity(entitySelf.nid), client);

            // Update self, to be new version in level
            entitySelf.client = client;
            client.entitySelf = entitySelf;
            client.entityPhaser = playerGraphic;

            client.positions = [];
            client.name = command.name;
            client.positions = [];

            // define the view (the area of the game visible to this client, all else is culled)
            client.view = {
                x: entitySelf.x,
                y: entitySelf.y,
                halfWidth: 99999,
                halfHeight: 99999
            };

        }


    }

    processClientCommand(command: any, client: any) {

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

    deathCallback = (playerEntityId: number, damagerEntityId: number):any => {
        console.log("Hitting death callback")
    }
}
