import nengi from "nengi";
import Phaser from "phaser";
import nengiConfig from "../../../common/config/nengiConfig";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Simulator from "../Simulator";
import RequestJoinGame from '../../../common/command/RequestJoinGame'

// const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
//   active: false,
//   visible: false,
//   key: "Game",
// };

export class MainScene extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
  nengiClient: ExtendedNengiTypes.Client;
  simulator: Simulator;
  last_ts: number

  levelName = "spawn_island";

  constructor() {
    super({});

    const client = new nengi.Client(
      nengiConfig,
      50
    ) as ExtendedNengiTypes.Client;
    this.nengiClient = client;
  }

  public preload() {
    this.load.image("player", "survivor-shotgun.png");

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON(this.levelName, this.levelName + ".json");
  }

  public create(data: any) {
    this.map = this.make.tilemap({ key: this.levelName });

    const tileset = this.map.addTilesetImage(
      "tuxmon-sample-32px-extruded",
      "tiles"
    );

    //@ts-ignore
    this.map.createStaticLayer(
      "Below Player",
      tileset,
      0,
      0
    );

    //@ts-ignore

    this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
    // this.worldLayer.setCollisionByProperty({ collides: true });

    // ------------ NENGI ------------------//

    this.simulator = new Simulator(this.nengiClient, this, this.map);

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

    // console.log("Requesting to join game in 5 seconds")

    console.log("Requesting to join game")
    const RequestJoinGameCommand = new RequestJoinGame("")
    this.nengiClient.addCommand(RequestJoinGameCommand)

  }

  public update() {

    // Compute delta time since last update.
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;

    const network = this.nengiClient.readNetwork();

    network.entities.forEach((snapshot: any) => {
      snapshot.createEntities.forEach((entity: any) => {
        console.log(`creating new ${entity.protocol.name} entity `, entity)
        this.simulator.createEntity(entity)
      })

      snapshot.updateEntities.forEach((update: any) => {

        this.simulator.updateEntity(update)
      })

      snapshot.deleteEntities.forEach((id: number) => {
        console.log(`Deleting entity `, id)
        this.simulator.deleteEntity(id)
      })
    })

    network.messages.forEach((message: any) => {
      console.log(`Recieved ${message.protocol.name} message:`, message);
      this.simulator.processMessage(message)
    });

    this.simulator.update(dt_sec);
    this.nengiClient.update();
  }
}
