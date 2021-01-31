import nengi from "nengi";
import Phaser from "phaser";
import nengiConfig from "../../../common/nengiconfig";
import { ExtendedNengiTypes } from "../../../common/custom-nengi-types";
import Simulator from "../Simulator";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: "Game",
};

export class MainScene extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
  nengiClient: ExtendedNengiTypes.Client;
  simulator: Simulator;
  last_ts: number

  state: {
    /* clientside state can go here */
    myId: number | null;
    myEntity: string | null;
  };

  constructor() {
    super(sceneConfig);
    this.state = {
      /* clientside state can go here */
      myId: null,
      myEntity: null,
    };

    const client = new nengi.Client(
      nengiConfig,
      50
    ) as ExtendedNengiTypes.Client;
    this.nengiClient = client;
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
    this.worldLayer.setCollisionByProperty({ collides: true });

    // ------------ NENGI ------------------//

    this.simulator = new Simulator(this.nengiClient, this);

    this.nengiClient.onConnect((res) => {
      console.log("onConnect response:", res);
    });

    this.nengiClient.onClose(() => {
      console.log("connection closed");
    });

    this.nengiClient.on("connected", (res) => {
      console.log("connection?:", res);
    });
    this.nengiClient.on("disconnected", () => {
      console.log("connection closed");
    });

    this.nengiClient.connect("ws://localhost:8079");
  }

  public update() {

    // Compute delta time since last update.
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;

    const network = this.nengiClient.readNetwork();

    network.entities.forEach((snapshot:any) => {
      snapshot.createEntities.forEach((entity:any) => {
          this.simulator.createEntity(entity)
      })

      snapshot.updateEntities.forEach((update:any) => {
          this.simulator.updateEntity(update)
      })

      snapshot.deleteEntities.forEach((id: string) => {
          this.simulator.deleteEntity(id)
      })
  })

    network.messages.forEach((message: any) => {
      this.simulator.processMessage(message)
      console.log("Recieved message:", message);
    });

    this.simulator.update(dt_sec);
    this.nengiClient.update();
  }
}
