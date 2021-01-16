// require('@geckos.io/phaser-on-nodejs')
import Phaser from "phaser";
import { ClientInputPacket, WorldStateUpdate } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../game/entity/entity";
const path = require("path");

export default class MainScene extends Phaser.Scene {

  // Server
  private io: SocketIO.Server;
  private port: string | number;

  // Connected clients and their entities.
  clients: { [key: string]: Entity } = {};
  entities: { [key: string]: Entity } = {};

  // Last processed input for each client.
  last_processed_input: any = {};

  // Server timer
  updateInternal: any;

  // Queue of client inputs to process on next tick
  clientPacketsToProcess: ClientInputPacket[] = []

  worldLayer: Phaser.Tilemaps.StaticTilemapLayer
  map: Phaser.Tilemaps.Tilemap

  private last_ts: number;


  preload() {

    const imgPath = path.join(__dirname, "..", "assets", "tuxmon-sample-32px-extruded.png");
    const mapPath = path.join(__dirname, "..", "assets", "first_map.json");

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
    const aboveLayer = this.map.createStaticLayer("Above Player", tileset, 0, 0);

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    aboveLayer.setDepth(10);

  }

  update() {
    console.log("-------");
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;
    console.log("Frame time", dt_sec);

    // Reset all velocity to zero, after frame processed
    for (const [key, entity] of Object.entries(this.entities)) {
      entity.update();
    }

    this.sendWorldState();

    this.processInputs();

  }

  private processInputs() {
    const validateInput = (input: ClientInputPacket) => {
      if (Math.abs(input.press_time) > 1 / 30) {
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
        this.entities[id].applyInput(message);
        this.last_processed_input[id] = message.input_sequence_number;
      }
    });

    // Reset all entities to zero, after we'rve processed all their
    // Show some info.
    let info = "Last acknowledged input: ";
    // Each client is a socket ID, with an entity attatched
    for (const [key, entity] of Object.entries(this.clients)) {
      info += "Player " + key + ": #" + (this.last_processed_input[entity.entity_id] || 0) + "   ";
      entity.setVelocity();
    }

  }

  private sendWorldState() {
    // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
    // (e.g. position of invisible enemies).
    const world_state: WorldStateUpdate[] = [];

    // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
    // (e.g. position of invisible enemies).
    for (const [key, entity] of Object.entries(this.entities)) {

      world_state.push({
        entity_id: key,
        positionx: entity.player.x,
        positiony: entity.player.y,
        last_processed_input: this.last_processed_input[key] || 0
      });

      console.log(entity.player.body.x);
      console.log(entity.player.body.y);
    }

    console.log("Emitting world state", world_state);
    this.io.emit("server_world_state_update", world_state);

  }

  private listen(): void {
    this.io.on("connect", (socket: any) => {

      console.log("Connected client on port %s.", this.port);

      // Create a new Entity for this Client.
      const entity_id = uuidv4();

      const entity = new Entity(this, entity_id, this.map, this.worldLayer);
      this.entities[entity_id] = entity;

      // Store entity information for this connectio., and provide the client
      // an entity ID, so they can send with their input packets
      // TODO - Validate the entity, is the client who owns it when sending position update
      this.clients[socket.id] = entity;
      this.io.to(socket.id).emit("player_info", this.clients[socket.id]);

      socket.on("client_input_packet", (packet: ClientInputPacket) => {
        this.clientPacketsToProcess.push(packet);
      });

      socket.on("disconnect", () => {

        console.log("Client disconnected with socket ID %s, Entity ID %s", socket.id, this.clients[socket.id].entity_id);

        delete this.entities[this.clients[socket.id].entity_id];
        delete this.clients[socket.id];

        console.log(`Clients len ${Object.keys(this.clients).length}, ent length ${this.entities.length}`);
      });
    });
  }

}