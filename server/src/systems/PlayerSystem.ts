import PlayerGraphicServer from "../graphics/PlayerGraphicServer";
import {config} from "../config/zombie_config";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import NetLog from "../../../common/message/NetLog";
import ZombieWaveMessage from "../../../common/message/ZombieWaveMessage";
import EasyStar from "easystarjs";
import {Bots, Bot}  from "../graphics/BotGraphicNew";
import PlayerEntity from "../../../common/entity/PlayerEntity";
import Identity from "../../../common/message/Identity";
import { BotSystem } from "./BotSystem";


export class PlayerSystem {
    playerGraphics: Map<number, PlayerGraphicServer> = new Map()

    public botSystem: BotSystem

    // spawns = []
    constructor(
        private scene: Phaser.Scene,
        private map: Phaser.Tilemaps.Tilemap,
        private worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
        private nengiInstance: ExtendedNengiTypes.Instance,
    ) {


    }

    respawnAllPlayers() {
        this.nengiInstance.clients.forEach((client:  ExtendedNengiTypes.Client) => {
            this.createPlayer(client)
        })
    }

    reviveAllDeadPlayers() {
        this.nengiInstance.clients.forEach((client:  ExtendedNengiTypes.Client) => {
            if (!client.isAlive) {
                this.createPlayer(client)
            }
        })

        // Give bonus points to survivers?
    }

    // Spawn individual client
    createPlayer(client: ExtendedNengiTypes.Client) {
        // Re-create the new player entity
        const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "human_spawn_point");

        const entitySelf = new PlayerEntity(spawnPoint.x, spawnPoint.y);
        this.nengiInstance.addEntity(entitySelf);

        // Create a new phaser bot and link to entity, we'll apply physics to for each path check
        const playerGraphic = new PlayerGraphicServer(this.scene, this.worldLayer, this.nengiInstance, client, entitySelf.x, entitySelf.y, entitySelf.nid, this.deathCallback, this.botSystem);
        this.playerGraphics.set(entitySelf.nid, playerGraphic);

        // Tell the client about the new entity ID they now control for this level
        this.nengiInstance.message(new Identity(entitySelf.nid), client);

        // Update self, to be new version in level
        entitySelf.client = client;
        client.entitySelf = entitySelf;
        client.entityPhaser = playerGraphic;
        client.isAlive = true

        // define the view (the area of the game visible to this client, all else is culled)
        client.view = {
            x: entitySelf.x,
            y: entitySelf.y,
            halfWidth: 99999,
            halfHeight: 99999
        };
    }

    deathCallback = (playerEntityId: number, damagerEntityId: number):any => {
        console.log("Hitting death callback")
    }

    getTotalAlivePlayerCount = (): any => {
        let totalAlive = 0
        this.nengiInstance.clients.forEach((client) => {
            if (client.isAlive) {
                totalAlive++
            }
        })
        return totalAlive
    }

    getTotalDeadPlayerCount = ():any => {
        let totalDead = 0
        this.nengiInstance.clients.forEach((client) => {
            if (!client.isAlive) {
                totalDead++
            }
        })
        return totalDead
    }

    getTotalPlayerCount = ():any => {
        let total = 0
        this.nengiInstance.clients.forEach((client) => {
            if (!client.isAlive) {
                total++
            }
        })
        return total
    }

    getClosestAliveClient = (posX: number, posY: number)  => {

        let currClosestDistance = +Infinity
        let currClosestClient = undefined as ExtendedNengiTypes.Client

        this.nengiInstance.clients.forEach((client) => {
            if (client.entitySelf && client.isAlive ) {
                let entity = client.entitySelf
                let diffX = Math.abs(posX - entity.x)
                let diffY = Math.abs(posY - entity.y)

                console.log({diffX, diffY, currClosestDistance})
                if (diffX + diffY < currClosestDistance) {
                    currClosestClient = client
                }
            }
        })

        if (currClosestClient) {
            console.log("Found a matching client")
            return currClosestClient.entitySelf
        } else {
            console.log("Unable to find a closest client")
            return null
        }
    }

    getEntityDetail = (entityNumber: number) => {
        // TODO return a COPY
        return this.nengiInstance.getEntity(entityNumber)
    }

    movePlayer(command:any, client: ExtendedNengiTypes.Client) {
        if (client.entitySelf && client.entityPhaser) {

            const clientEntityPhaser = client.entityPhaser;
            const clientEntitySelf = client.entitySelf;

            // Process move on phaser, and sync with entity
            clientEntityPhaser.processMove(command);
            clientEntitySelf.x = clientEntityPhaser.x;
            clientEntitySelf.y = clientEntityPhaser.y;
            clientEntitySelf.rotation = clientEntityPhaser.rotation;
            clientEntityPhaser.weaponSystem.update(command.delta)

            // Update player views
            this.nengiInstance.clients.forEach((client: ExtendedNengiTypes.Client, index) => {
                client.view.x = clientEntityPhaser.x;
                client.view.y = clientEntityPhaser.y;
            });
        } else {
            console.log("level one - Trying to process commands on a player entity, which doesn't exist");
        }
    }
}