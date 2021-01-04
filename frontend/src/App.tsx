import Phaser from "phaser";
import { ArrowKeys, WASDKeys } from "./constants/keybinds";
import io from "socket.io-client";
import { ClientInputPacket, WorldStateUpdate } from "./types";
import { Entity } from "./game-objects/entity/entity";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: "Game",
};

const update_rate = 60;
const server_update_rate = 10;
let tick: any = 0;

export class GameScene extends Phaser.Scene {
  private player: Phaser.Physics.Arcade.Sprite;
  private keyboard: any;
  private socket: SocketIOClient.Socket;

  // Player
  private entity_id: string;
  private last_ts: number;
  private input_sequence_number = 0;
  private pending_inputs: ClientInputPacket[] = [];
  private latestWorldUpdate: WorldStateUpdate[] = [];
  entities: { [key: string]: Entity } = {};
  private map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;

  server_reconciliation = true;
  entity_interpolation = true;
  client_side_prediction = true;

  serverVisualisation: Entity;

  constructor() {
    super(sceneConfig);
  }

  public preload() {
    // this.load.image("tiles", "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/tilesets/super-mario-tiles.png");
    this.load.image("player", "survivor-shotgun.png");

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON("map", "first_map.json");

    this.load.atlas(
      "atlas",
      "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.png",
      "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json"
    );
  }

  public create() {
    // Establish socket communication channel
    this.socket = io("http://localhost:4001");

    this.socket.on("connect", (info: any) => {
      console.log("Connected!");
    });

    this.socket.on("player_info", (data: any) => {
      console.log(data);
      this.entity_id = data.entity_id;
    });

    this.socket.on(
      "server_world_state_update",
      (update: WorldStateUpdate[]) => {
        this.latestWorldUpdate = update;
      }
    );

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
    const aboveLayer = this.map.createStaticLayer(
      "Above Player",
      tileset,
      0,
      0
    );

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    aboveLayer.setDepth(10);

    this.keyboard = this.input.keyboard.addKeys(WASDKeys);

    this.serverVisualisation = new Entity(
      this,
      "100",
      this.entity_id,
      this.map,
      this.worldLayer,
      0,
      0
    );
  }

  public update() {
    // Reset all velocity to zero, after frame processed
    for (const [key, entity] of Object.entries(this.entities)) {
      entity.update();
      if (tick === 10) {
        console.log(entity.player.x, entity.player.y);
      }
    }

    this.processServerMessages();

    // We cannot process inputs until the server has provided us
    // a world update (and therefore we build entities), as client side
    // prediction will have no entity to work from
    if (this.entity_id == null || !this.entities[this.entity_id]) {
      console.log("Waiting for client to connect");
      return; // Not connected yet.
    }

    tick++;

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

    const left = this.keyboard.left.isDown;
    const right = this.keyboard.right.isDown;
    const up = this.keyboard.up.isDown;
    // const down = this.keyboard.down.isDown || tick < 10;
    const down = this.keyboard.down.isDown;
    // const down = tick < 10 ? true : false;

    if (!left && !right && !up && !down) {
      // Nothing interesting happened.
      return;
    }

    // Package player's input.
    let input: ClientInputPacket = {
      left: left,
      right: right,
      up: up,
      down: down,
      press_time: dt_sec,
      input_sequence_number: this.input_sequence_number++,
      entity_id: this.entity_id,
    };

    this.socket.emit("client_input_packet", input);

    // Do client-side prediction.
    if (this.client_side_prediction) {
      this.entities[this.entity_id].applyInput(input);
    }

    // Save this input for later reconciliation.
    this.pending_inputs.push(input);
  }

  private processServerMessages = () => {
    if (!this.latestWorldUpdate.length) {
      return;
    }

    // World state is a list of entity states.
    for (var i = 0; i < this.latestWorldUpdate.length; i++) {
      let state = this.latestWorldUpdate[i];

      // If this is the first time we see this entity, create a local representation.
      if (!this.entities[state.entity_id]) {
        let entity = new Entity(
          this,
          state.entity_id,
          this.entity_id,
          this.map,
          this.worldLayer,
          state.positionx,
          state.positiony
        );
        this.entities[state.entity_id] = entity;
      }

      let entity = this.entities[state.entity_id];

      if (state.entity_id === this.entity_id) {
        const diff = (oldNumber: number, newNumber: number) => {
          var decreaseValue = oldNumber - newNumber;

          return Math.abs((decreaseValue / oldNumber) * 100);
        };

        this.serverVisualisation.player.x = state.positionx;
        this.serverVisualisation.player.y = state.positiony;

        const helpText = this.add.text(16, 16,
          `
          ServerX ${state.positionx.toFixed(2)}, ClientX ${entity.player.x.toFixed(2)}
          ServerY ${state.positiony.toFixed(2)} ClientY ${entity.player.y.toFixed(2)}}
          `
        , {
            fontSize: '18px',
            padding: { x: 10, y: 5 },
            backgroundColor: '#000000',
            fill: '#ffffff'
        });
        helpText.setScrollFactor(0);

        // drawDebug();

        if (
          diff(entity.player.x, state.positionx) < 10 &&
          diff(entity.player.y, state.positiony) < 10
        ) {
          console.log(
            `Server processed input ${state.last_processed_input}, ignored as it's within threshold of error`
          );
          console.log(
            `ServerX ${state.positionx}, ClientX ${entity.player.x} : ServerY ${state.positiony} ClientY ${entity.player.y}}`
          );
        } else {
          console.log(
            `Correcting position for input ${state.last_processed_input}`
          );
          console.log(
            `ServerX ${state.positionx}, ClientX ${entity.player.x} : ServerY ${state.positiony} ClientY ${entity.player.y}}`
          );

          entity.player.x = state.positionx;
          entity.player.y = state.positiony;
        }

        if (this.server_reconciliation) {
          // Server Reconciliation. Re-apply all the inputs not yet processed by
          // the server.
          var j = 0;
          while (j < this.pending_inputs.length) {
            var input = this.pending_inputs[j];
            if (input.input_sequence_number <= state.last_processed_input) {
              // Already processed. Its effect is already taken into account into the world update
              // we just got, so we can drop it.
              this.pending_inputs.splice(j, 1);
            } else {
              // Not processed by the server yet. Re-apply it.
              console.log("Re-applying ", input);
              entity.applyInput(input);
              j++;
            }
          }
        } else {
          // Reconciliation is disabled, so drop all the saved inputs.
          this.pending_inputs = [];
        }
      } else {
        // Received the position of an entity other than this client's.

        if (!this.entity_interpolation) {
          // Entity interpolation is disabled - just accept the server's position.
          entity.player.x = state.positionx;
          entity.player.y = state.positiony;
        } else {
          // Add it to the position buffer.
          var timestamp = +new Date();
          // TODO - Come back to this
          entity.position_buffer.push([
            timestamp,
            state.positionx,
            state.positiony,
          ]);
        }
      }
    }

    this.latestWorldUpdate = [];
  };

  interpolateEntities = () => {
    // Compute render timestamp.
    var now = +new Date();
    var render_timestamp = now - 1000.0 / server_update_rate;

    for (var i in this.entities) {
      var entity = this.entities[i];

      // No point in interpolating this client's entity.
      if (entity.entity_id === this.entity_id) {
        continue;
      }

      // Find the two authoritative positions surrounding the rendering timestamp.
      var buffer = entity.position_buffer;

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

        entity.player.x =
          x0 + ((x1 - x0) * (render_timestamp - t0)) / (t1 - t0);
        entity.player.y =
          y0 + ((y1 - y0) * (render_timestamp - t0)) / (t1 - t0);
      }
    }
  };
}

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: "Game",
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  fps: {
    target: update_rate,
    forceSetTimeOut: true,
  },
  parent: "game-here",
  backgroundColor: "#000",
  scene: GameScene,
};

export const game = new Phaser.Game(gameConfig);

const App = () => {
  return <div id="game-here"></div>;
};

export default App;
