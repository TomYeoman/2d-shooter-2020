import nengi from "nengi"
import { SCENE_NAMES } from "../../../frontend/src/game/index"
import RequestJoinGame from "../../../common/command/RequestJoinGame"
import PlayerCharacter from "../../../common/entity/PlayerCharacter"
import Identity from "../../../common/message/Identity"
import LobbyStateMessage from "../../../common/message/LobbyStateMessage"
import {lobbyState} from "../../../common/types/types"

export class LobbyManager {

    nengiInstance: nengi.Instance
    gameMode: string = "This is a demo game"
    scene:string =  "demo-scene"
    timeRemaining: number = -1
    state: lobbyState
    sceneMap: Phaser.Tilemaps.Tilemap
    lobbyMinimum: number = 2

    constructor(nengiInstance: nengi.Instance, sceneMap: Phaser.Tilemaps.Tilemap) {
        this.nengiInstance = nengiInstance
        this.state = lobbyState.WAITING_FOR_PLAYERS
        this.sceneMap = sceneMap


    }

    connectClient(command: RequestJoinGame, client: any) {
        console.log("Playing is joining lobby")

        this.checkGameIsReadyToBegin(command, client)
    }

    checkGameIsReadyToBegin(command:RequestJoinGame, client: any) {
        const playerCount = this.nengiInstance.clients.toArray().length
        const spawnPoint: any = this.sceneMap.findObject("Objects", (obj: any) => obj.name === "Spawn Point");

        console.log(`Checking whether game is ready to start with ${playerCount} players, and ${this.lobbyMinimum} minimum`)


        if (playerCount >= this.lobbyMinimum) {
            console.log(`Beginning game`)

            // Choose scene (would be dynamic in future)
            this.scene = SCENE_NAMES.LEVEL_ONE

            // Broadcast game start, and scene change to all clients
            this.state = lobbyState.IN_PROGRESS

            // Create player for each client and tell them it
            this.nengiInstance.clients.forEach(client => {

                console.log("Sending message to client")
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.scene, playerCount, this.lobbyMinimum), client)


                // Now all clients have moved to new scene, change scene on server
                // TODO - Maybe add a timer here?
            })


        } else {

            console.log(`Spawning player into lobby`)

            // Put them into waiting area, with a player count
            // TODO - If game hasn't started, we should tell everyone when somenew new joins
            this.nengiInstance.clients.forEach(client => {
                this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.scene, playerCount, this.lobbyMinimum), client)
            })


            const entitySelf = new PlayerCharacter(spawnPoint.x, spawnPoint.y)
            this.nengiInstance.addEntity(entitySelf)

            // tell the client which entities it controls
            this.nengiInstance.message(new Identity(entitySelf.nid), client)

            // establish a relation between this entity and the client
            entitySelf.client = client
            client.entitySelf = entitySelf
            client.name = command.name
            client.positions = []

            // define the view (the area of the game visible to this client, all else is culled)
            client.view = {
                x: entitySelf.x,
                y: entitySelf.y,
                halfWidth: 99999,
                halfHeight: 99999
            }

        }
    }

    // Frontend shoujldn't allow move to be called before start - but check incase
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
            console.log("Trying to process commands on a player entity, which doesn't exist")
        }
    }

}