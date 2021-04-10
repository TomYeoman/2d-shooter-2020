import nengi from "nengi";
import { SCENE_NAMES } from "../../../frontend/src/game/index";
import RequestJoinGame from "../../../common/command/RequestJoinGame";
import PlayerEntity from "../../../common/entity/PlayerEntity";
import Identity from "../../../common/message/Identity";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";
import { lobbyState } from "../../../common/types/types";
import { commandTypes } from "../../../common/types/types";
import PlayerGraphicServer from "../../../common/graphics/PlayerGraphicServer";
export class LobbyManager {

    nengiInstance: nengi.Instance
    gameMode = "This is a demo game"
    scene = "demo-scene"
    timeRemaining = -1
    state: lobbyState
    sceneMap: Phaser.Tilemaps.Tilemap
    lobbyMinimum = 10
    phaserInstance: Phaser.Scene
    playerGraphics: Map<number, PlayerGraphicServer>

    // When we change scene, we must also cancel the input handler timer in main scene
    // Otherwise we'll be processing inputs twice
    inputHandlerTimer: any
    hasGameStarted = false

    constructor(phaserInstance: Phaser.Scene, nengiInstance: nengi.Instance, sceneMap: Phaser.Tilemaps.Tilemap, inputHandlerTimer: any) {
        this.nengiInstance = nengiInstance;
        this.state = lobbyState.WAITING_FOR_PLAYERS;
        this.sceneMap = sceneMap;
        this.phaserInstance = phaserInstance;
        this.inputHandlerTimer = inputHandlerTimer;

    }

    connectClient(command: RequestJoinGame, client: any) {
        console.log("Playing is joining lobby");

        this.checkGameIsReadyToBegin(command, client);
    }

    disconnectClient(entityId: number) {
        console.log(`Removing player graphic ${entityId}`);
        // Delete server copy
        const player = this.playerGraphics.get(entityId);
        player.destroy();
        this.playerGraphics.delete(entityId);
    }

    checkGameIsReadyToBegin(command: RequestJoinGame, client: any) {
        const playerCount = this.nengiInstance.clients.toArray().length;
        const spawnPoint: any = this.sceneMap.findObject("Objects", (obj: any) => obj.name === "Spawn Point");

        console.log(`Checking whether game is ready to start with ${playerCount} players, and ${this.lobbyMinimum} minimum`);


        if (playerCount >= this.lobbyMinimum && !this.hasGameStarted) {
            console.log("Lobby now full, starting game in 5 seconds");

            // We should update lobby event, to tell when to transition
            // this.hasGameStarted = true

            // setTimeout(() => {
            console.log("Beginning game");

            this.state = lobbyState.IN_PROGRESS;
            // Choose scene (would be dynamic in future)
            this.scene = SCENE_NAMES.LEVEL_ONE;

            // Broadcast game start, and scene change to all clients
            this.nengiInstance.clients.forEach(client => {

                console.log("Moving client ");
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.scene, playerCount, this.lobbyMinimum), client);

                clearInterval(this.inputHandlerTimer);
            });

            this.phaserInstance.scene.sleep(SCENE_NAMES.MAIN);

            // Run our minigame of choice, passing in nengi
            this.phaserInstance.scene.run(this.scene, { nengiInstance: this.nengiInstance });

            // }, 3000)

        } else {
            console.log("Spawning player into lobby until game starts");

            // Put them into waiting area, with a player count
            // TODO - If game hasn't started, we should tell everyone when somenew new joins
            this.nengiInstance.clients.forEach(client => {
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.scene, playerCount, this.lobbyMinimum), client);
            });

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

        // Frontend shouldn't allow move to be called before start - but check incase
        if (client.entitySelf) {

            const entitySelf = client.entitySelf;

            if (command.protocol.name === commandTypes.MOVE_COMMAND) {
                entitySelf.processMove(command)
            }

            this.nengiInstance.clients.forEach((client, index) => {
                // console.log("Updating client ", index)

                client.view.x = entitySelf.x;
                client.view.y = entitySelf.y;
            });

        } else {
            console.log("Trying to process commands on a player entity, which doesn't exist");
        }
    }

}