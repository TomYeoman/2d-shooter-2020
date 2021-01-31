import nengi from "nengi";
import Phaser from "phaser";
import nengiConfig from "../../../common/nengiconfig";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Simulator from "../Simulator";
import RequestJoinGame from '../../../common/command/RequestJoinGame'
import { lobbyState } from "../../../common/types/types";
import LobbyStateMessage from "../../../common/message/LobbyStateMessage";

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
    myId: number | null;
    myEntity: string | null;
    // lobbyState: LobbyStateMessage
  };

  constructor() {
    super(sceneConfig);
    this.state = {
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

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON("map", "spawn_island.json");
  }

  public create() {
    this.map = this.make.tilemap({ key: "map" });

    const tileset = this.map.addTilesetImage(
      "tuxmon-sample-32px-extruded",
      "tiles"
    );

    const belowLayer = this.map.createStaticLayer(
      "Below Player",
      tileset,
      0,
      0
    );
    this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
    this.worldLayer.setCollisionByProperty({ collides: true });

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

    // setTimeout(() => {
    //   const RequestJoinGameCommand = new RequestJoinGame("")
    //   this.nengiClient.addCommand(RequestJoinGameCommand)
    // }, 5000)

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
