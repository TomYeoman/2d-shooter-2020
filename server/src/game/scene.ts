// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
import { ClientInputPacket, EntityEnum, WorldStateUpdate, EntityWall, Entities } from "../../../common/types/types";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../../../common/entities/player";
import { Wall } from "../../../common/entities/wall";
import { serverBroadcastRate } from "../../../common/config/phaserConfig";
const path = require("path");

export default class MainScene extends Phaser.Scene {

  // Server
  private io: SocketIO.Server;
  private port: string | number;

  // Connected clients and their entities.
  clients: { [key: string]: any } = {};
  entities: Entities = {};

  // Last processed input for each client.
  last_processed_input: any = {};

  // Server timer
  updateInternal: any;

  // Queue of client inputs to process on next tick
  clientPacketsToProcess: ClientInputPacket[] = []

  worldLayer: Phaser.Tilemaps.StaticTilemapLayer
  map: Phaser.Tilemaps.Tilemap

  private lastTs: number;


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
      const { socketIo } = this.game.config.preBoot();
      this.io = socketIo;
    } catch (e) {
      console.log("Error extracting preBoot data", e);
    }

  }
  create() {
    console.log("Running create");
    this.listen();

    this.map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = this.map.createStaticLayer("Below Player", tileset, 0, 0);
    this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
    // const aboveLayer = this.map.createStaticLayer("Above Player", tileset, 0, 0);

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    // aboveLayer.setDepth(10);

    setInterval(() => {
      this.sendWorldState();
    }, 1000 / serverBroadcastRate);

  }

  update() {
    console.log("-------");
    const nowTs = +new Date();
    const lastTs = this.lastTs || nowTs;
    const dtSec = (nowTs - lastTs) / 1000.0;
    this.lastTs = nowTs;
    console.log("Frame time", dtSec);

    for (const [key, entity] of Object.entries(this.entities)) {
      if (entity instanceof Wall) {
        // entity.sprite.x += 0.1;
        entity.update();
      } else {
        // Reset all velocity to zero, after frame processed
        entity.resetVelocity();
        // if (entity.playerType === "bot") {
        //   entity.generateBotMovement();
        // }
      }
    }

    // this.sendWorldState();
    this.processInputs();

  }

  private processInputs() {
    const validateInput = (input: ClientInputPacket) => {
      if (Math.abs(input.press_time) > 1 / 20) {
        console.log("Discarding input with time of", input.press_time);
        return false;
      }
      return true;
    };

    const packetsToProcess = this.clientPacketsToProcess;
    this.clientPacketsToProcess = [];

    packetsToProcess.forEach(message => {
      // Update the state of the entity, based on its input.
      // We just ignore inputs that don't look valid; this is what prevents clients from cheating.
      if (validateInput(message)) {
        const id = message.entity_id;

        const entity = this.entities[id];
        if (entity instanceof Player) {
          entity.applyInput(message);
        } else {
          // No behaviour for handling inputs recieved against any other entitys for now
        }

        this.last_processed_input[id] = message.input_sequence_number;
      }
    });

    // Reset all entities to zero, after we'rve processed all their
    // Show some info.
    let info = "Last acknowledged input: ";
    // Each client is a socket ID, with an entity attatched
    for (const [key, entity] of Object.entries(this.clients)) {
      info += "Player " + key + ": #" + (this.last_processed_input[entity.entity_id] || 0) + "   ";
      // entity.setVelocity();
    }

  }

  private sendWorldState() {
    // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
    // (e.g. position of invisible enemies).
    const worldState: WorldStateUpdate = [];

    // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
    // (e.g. position of invisible enemies).
    for (const [key, entity] of Object.entries(this.entities)) {

      switch (entity.type) {

          case EntityEnum.PLAYER:
          worldState.push({
              type: entity.type,
              entity_id: key,
              x: entity.sprite.x,
              y: entity.sprite.y,
              last_processed_input: this.last_processed_input[key] || 0
            });

          break;
           case EntityEnum.WALL:
            worldState.push({
                entity_id: entity.entity_id,
                type: entity.type,
                x: entity.sprite.x,
                y: entity.sprite.y,
                last_processed_input: this.last_processed_input[key] || 0

              });
            break;
        default:
          console.log("Unable to find entity type, skipping from world update ");
          break;
      }

      // console.log(entity.sprite.body.x);
      // console.log(entity.sprite.body.y);
    }

    // console.log("Emitting world state", worldState);
    this.io.emit("server_world_state_update", worldState);

  }

  private listen(): void {
    this.io.on("connect", (socket: any) => {

      console.log("Connected client on port %s.", this.port);

      // Create a new Entity for this Client.
      const entity_id = uuidv4();

      const spawnPoint: any = this.map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");
      const entity = new Player(this, this.worldLayer, entity_id, spawnPoint.x, spawnPoint.y, "player", this.entities);

      console.log("New entity created", entity.entity_id, entity.type);
      this.entities[entity_id] = entity;

      // Store entity information for this connectio., and provide the client
      // an entity ID, so they can send with their input packets
      // TODO - Validate the entity, is the client who owns it when sending position update
      this.clients[socket.id] = entity;
      this.io.to(socket.id).emit("player_info", this.clients[socket.id].entity_id);

      socket.on("client_input_packet", (packet: ClientInputPacket) => {
        this.clientPacketsToProcess.push(packet);
      });

      socket.on("disconnect", () => {

        console.log("Client disconnected with socket ID %s, Entity ID %s", socket.id, this.clients[socket.id].entity_id);

        delete this.entities[this.clients[socket.id].entity_id];
        delete this.clients[socket.id];

        console.log(`Clients len ${Object.keys(this.clients).length}, ent length ${this.entities.length}`);
      });



      function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }


      setTimeout(() => {
        this.entities[1] = new Wall(this, this.entities, 200, 200);
      }, 100);
      // setTimeout(() => {
      //   for (let i = 0;i<10; i++) {
      //     const entity = new Player(this, this.worldLayer, uuidv4(),  getRandomInt(1, 500), getRandomInt(1, 500), "bot", this.entities);
      //     this.entities[entity.entity_id] = entity;
      //   }
      // }, 100);

    });
  }

}