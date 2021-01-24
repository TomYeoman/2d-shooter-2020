import Phaser from "phaser";
import io from "socket.io-client";
import {
  ClientInputPacket,
  Entities,
  EntityEnum,
  WorldStateUpdate,
  EntityPlayer,
  EntityWall,
} from "../../common/types/types";
import { Player } from "../../common/entities/player";
import { InputSystem } from "./inputSystem";
import {
  phaserGameConfig,
  serverBroadcastRate,
  clientFPS,
} from "../../common/config/phaserConfig";
import { Wall } from "../../common/entities/wall";
// import react from "react"

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: "Game",
};

export class GameScene extends Phaser.Scene {
  private socket: SocketIOClient.Socket;

  playerInput: InputSystem;

  // Player
  private entity_id: string;
  private last_ts: number;
  private input_sequence_number = 0;
  private pending_inputs: ClientInputPacket[] = [];
  private latestWorldUpdate: WorldStateUpdate = [];
  entities: Entities = {};
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
  server_reconciliation = false;
  entity_interpolation = true;
  client_side_prediction = true;

  serverVisualisation: Player;

  constructor() {
    super(sceneConfig);
  }

  public preload() {
    this.load.image("player", "survivor-shotgun.png");

    // this.load.image("tiles", "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/tilesets/super-mario-tiles.png");
    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON("map", "demo_map_v1.json");
    // this.load.tilemapTiledJSON("map", "first_map.json");
    this.load.atlas(
      "atlas",
      "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.png",
      "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json"
    );
  }

  public create() {
    this.setupSocketConnection();

    this.map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = this.map.addTilesetImage(
      "tuxmon-sample-32px-extruded",
      "tiles"
    );

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = this.map.createStaticLayer(
      "Below Player",
      tileset,
      0,
      0
    );
    this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
    // const aboveLayer = this.map.createStaticLayer(
    //   "Above Player",
    //   tileset,
    //   0,
    //   0
    // );

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    // aboveLayer.setDepth(10);

    this.playerInput = new InputSystem(this);

    this.serverVisualisation = new Player(this, this.worldLayer, "100", 0, 0, "player", this.entities);
  }

  public setupSocketConnection() {
    // Establish socket communication channel
    this.socket = io("http://localhost:4001");

    this.socket.on("connect", (info: any) => {
      console.log("Connected!");
    });

    this.socket.on("player_info", (data: any) => {
      console.log(data);
      this.entity_id = data.entity_id;
    });

    this.socket.on("server_world_state_update", (update: WorldStateUpdate) => {
      this.latestWorldUpdate = update;
    });
  }

  public update() {
    // Reset all velocity to zero, after frame processed
    for (const [key, entity] of Object.entries(this.entities)) {
      if (entity instanceof Player) {
        entity.resetVelocity();
      } else {
        // No behaviour for handling inputs recieved against any other entitys for now
        entity.updateClient()
      }
    }

    // Update clients key inputs
    this.playerInput.updateInputState();

    // Reconcile client with server
    this.processServerMessages();

    // We cannot process inputs until the server has provided us
    // a world update (and therefore we build entities), as client side
    // prediction will have no entity to work from
    if (this.entity_id == null || !this.entities[this.entity_id]) {
      console.log("Waiting for client to connect");
      return; // Not connected yet.
    }

    this.processInput();

    if (this.entity_interpolation) {
      this.interpolateEntities();
    }
  }

  private processInput() {
    // Compute delta time since last update.
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;

    if (!this.playerInput.isMoving) {
      return; // Nothing interesting happened.
    }

    // Package player's input.
    let input: ClientInputPacket = {
      left: this.playerInput.frameInputState.left,
      right: this.playerInput.frameInputState.right,
      up: this.playerInput.frameInputState.up,
      down: this.playerInput.frameInputState.down,
      press_time: dt_sec,
      input_sequence_number: this.input_sequence_number++,
      entity_id: this.entity_id,
    };

    this.socket.emit("client_input_packet", input);

    // Do client-side prediction.
    if (this.client_side_prediction) {
      let clientEntity = this.entities[this.entity_id];
      if (clientEntity instanceof Player) {
        clientEntity.applyInput(input);
        clientEntity.setVelocity();
      } else {
        // No behaviour for handling inputs recieved against any other entitys for now
      }
    }

    // Save this input for later reconciliation.
    // this.pending_inputs.push(input);
  }

  private printDebug(state: any, entity: any) {
    const helpText = this.add.text(
      16,
      16,
      `
      ServerX ${state.x.toFixed(2)}, ClientX ${entity.sprite.x.toFixed(
        2
      )}
      ServerY ${state.y.toFixed(2)} ClientY ${entity.sprite.y.toFixed(
        2
      )}}
      key down = ${this.playerInput.isMoving}
      `,
      {
        fontSize: "18px",
        padding: { x: 10, y: 5 },
        backgroundColor: "#000000",
        fill: "#ffffff",
      }
    );
    helpText.setScrollFactor(0);
  }

  private buildInitialEntity(state: EntityPlayer | EntityWall) {

    let entity: Player | Wall;

    if (state.type === EntityEnum.PLAYER) {
      entity = new Player(
        this,
        this.worldLayer,
        state.entity_id,
        state.x,
        state.y,
        "player",
        this.entities
      );

      // If this entity was my own character - attatch camera
      if (entity.entity_id === this.entity_id) {
        entity.sprite.debugBodyColor = 1;

        const camera = this.cameras.main;
        camera.startFollow(entity.sprite);
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Watch the player and worldLayer for collisions, for the duration of the scene:
        this.physics.add.collider(entity.sprite, this.worldLayer);
      }

    } else {
      entity = new Wall(this, this.entities, state.x, state.y);
      console.log(entity)
    }

    this.entities[state.entity_id] = entity;
  }

  private processServerMessages = () => {
    if (!this.latestWorldUpdate.length) {
      return;
    }

    // World state is a list of entity states.
    for (var i = 0; i < this.latestWorldUpdate.length; i++) {
      let latestServerState = this.latestWorldUpdate[i];

      // If this is the first time we see this entity, create a local representation.
      if (!this.entities[latestServerState.entity_id]) {
        this.buildInitialEntity(latestServerState);
      }

      let entity = this.entities[latestServerState.entity_id]

      // Must be the server updating, containing clients information
      if (latestServerState.entity_id === this.entity_id) {

        this.serverVisualisation.sprite.x = latestServerState.x;
        this.serverVisualisation.sprite.y = latestServerState.y;

        this.printDebug(latestServerState, entity);
        // calculate the offset between server and client
        const offsetX = entity.sprite.x - latestServerState.x;
        const offsetY = entity.sprite.y - latestServerState.y;

        // we correct the position faster if the player moves
        // const correction = 20
        const correction = this.playerInput.isMoving ? 20 : 100;

        // apply a step by step correction of the player's position
        entity.sprite.x -= offsetX / correction;
        entity.sprite.y -= offsetY / correction;
      } else {
        // Received the position of an entity other than this client's.

        if (!this.entity_interpolation) {
          // Entity interpolation is disabled - just accept the server's position.
          entity.sprite.x = latestServerState.x;
          entity.sprite.y = latestServerState.y;
        } else {
          // Add it to the position buffer.
          var timestamp = +new Date();
          // TODO - Come back to this
          entity.position_buffer.push([
            timestamp,
            latestServerState.x,
            latestServerState.y,
          ]);
        }
      }
    }

    this.latestWorldUpdate = [];
  };

  interpolateEntities = () => {
    // Compute render timestamp.
    var now = +new Date();
    var render_timestamp = now - 1000.0 / serverBroadcastRate;

    for (var i in this.entities) {
      var entity = this.entities[i];

      // No point in interpolating this client's entity.
      if (entity.entity_id === this.entity_id) {
        continue;
      }

      const buffer = entity.position_buffer;

      // Find the two authoritative positions surrounding the rendering timestamp.
      // Drop older positions.

      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        buffer.shift();
      }

      // Interpolate between the two surrounding authoritative positions.
      if (
        buffer.length >= 2 &&
        buffer[0][0] <= render_timestamp &&
        render_timestamp <= buffer[1][0]
      ) {
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];

        var x0 = buffer[0][1];
        var x1 = buffer[1][1];

        var y0 = buffer[0][2];
        var y1 = buffer[1][2];


        // entity.sprite.body.x = entity.sprite.x
        // entity.sprite.body.y = entity.sprite.y
        entity.sprite.setVelocity(0)

        entity.sprite.x =
          x0 + ((x1 - x0) * (render_timestamp - t0)) / (t1 - t0);
        entity.sprite.y =
          y0 + ((y1 - y0) * (render_timestamp - t0)) / (t1 - t0);

        entity.sprite.setVelocity(0)


      }
    }
  };
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  ...phaserGameConfig,
  type: Phaser.AUTO,
  fps: {
    target: clientFPS,
    forceSetTimeOut: true,
  },
  parent: "game-here",
  scene: GameScene,
};

export const game = new Phaser.Game(gameConfig);

const App = () => {
  return <div id="game-here"></div>;
};

export default App;
