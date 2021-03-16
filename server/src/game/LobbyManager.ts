import nengi from "nengi"
import { SCENE_NAMES } from "../../../frontend/src/game/index"
import RequestJoinGame from "../../../common/command/RequestJoinGame"
import PlayerCharacter from "../../../common/entity/PlayerCharacter"
import Identity from "../../../common/message/Identity"
import LobbyStateMessage from "../../../common/message/LobbyStateMessage"
import {lobbyState} from "../../../common/types/types"
import {commandTypes} from '../../../common/types/types'
export class LobbyManager {

    nengiInstance: nengi.Instance
    gameMode: string = "This is a demo game"
    scene:string =  "demo-scene"
    timeRemaining: number = -1
    state: lobbyState
    sceneMap: Phaser.Tilemaps.Tilemap
    lobbyMinimum: number = 1
    phaserInstance: Phaser.Scene

    // When we change scene, we must also cancel the input handler timer in main scene
    // Otherwise we'll be processing inputs twice
    inputHandlerTimer:any
    hasGameStarted:boolean = false

    constructor(phaserInstance: Phaser.Scene, nengiInstance: nengi.Instance, sceneMap: Phaser.Tilemaps.Tilemap, inputHandlerTimer: any) {
        this.nengiInstance = nengiInstance
        this.state = lobbyState.WAITING_FOR_PLAYERS
        this.sceneMap = sceneMap
        this.phaserInstance = phaserInstance
        this.inputHandlerTimer = inputHandlerTimer

    }

    connectClient(command: RequestJoinGame, client: any) {
        console.log("Playing is joining lobby")

        this.checkGameIsReadyToBegin(command, client)
    }

    checkGameIsReadyToBegin(command: RequestJoinGame, client: any) {
        const playerCount = this.nengiInstance.clients.toArray().length
        const spawnPoint: any = this.sceneMap.findObject("Objects", (obj: any) => obj.name === "Spawn Point");

        console.log(`Checking whether game is ready to start with ${playerCount} players, and ${this.lobbyMinimum} minimum`)


        if (playerCount >= this.lobbyMinimum && !this.hasGameStarted) {
            console.log(`Lobby now full, starting game in 5 seconds`)

            // We should update lobby event, to tell when to transition
            this.hasGameStarted = true

            setTimeout(() => {
                console.log(`Beginning game`)

                this.state = lobbyState.IN_PROGRESS
                // Choose scene (would be dynamic in future)
                this.scene = SCENE_NAMES.LEVEL_ONE

                // Broadcast game start, and scene change to all clients
                this.nengiInstance.clients.forEach(client => {

                    console.log("Moving client ")
                    this.nengiInstance.message(new LobbyStateMessage(this.state, this.gameMode, this.scene, playerCount, this.lobbyMinimum), client)

                    clearInterval(this.inputHandlerTimer)
                })

                this.phaserInstance.scene.sleep(SCENE_NAMES.MAIN)

                // Run our minigame of choice, passing in nengi
                this.phaserInstance.scene.run(this.scene, { nengiInstance: this.nengiInstance })

            }, 3000)

        }

        console.log(`Spawning player into lobby until game starts`)

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

    processClientCommand(command: any, client: any) {

        // Frontend shouldn't allow move to be called before start - but check incase
        if (client.entitySelf) {

            const entitySelf = client.entitySelf

            if (command.protocol.name === commandTypes.MOVE_COMMAND) {
                entitySelf.processMove(command)
            }

            this.nengiInstance.clients.forEach((client, index )=> {
                // console.log("Updating client ", index)

                client.view.x = entitySelf.x
                client.view.y = entitySelf.y
            })

        } else {
            console.log("Trying to process commands on a player entity, which doesn't exist")
        }
    }

}