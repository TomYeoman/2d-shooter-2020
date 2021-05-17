import nengi from "nengi";
import Phaser from "phaser";
import nengiConfig from "../../../common/config/nengiConfig";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import Simulator from "../Simulator";
import RequestJoinGame from '../../../common/command/RequestJoinGame'
import ModifyToolbarCommand from '../../../common/command/ModifyToolbarCommand'
import { store } from '../app/store'
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
  store: typeof store
  oldState:  ReturnType<typeof store.getState>

  init({ nengiClient, storeRef }: {nengiClient: any, storeRef: typeof store}) {
    // super({});
    this.nengiClient = nengiClient;
    // try {
    //     // @ts-ignore
    //     const { nengiClient } = nengiClient;
    //     this.nengiClient = nengiClient;

    // } catch (e) {
    //     console.log("Error extracting preBoot data", e);
    // }

    // const client = new nengi.Client(
    //   nengiConfig,
    //   100
    // ) as ExtendedNengiTypes.Client;
    // this.nengiClient = client;

      // Start listening for changes
      // debugger
    this.store = storeRef
    this.store.subscribe(() => this.stateUpdated())


  }

  stateUpdated() {
    // console.log("stat eupdated")
    const newState = this.store.getState()
    console.log(newState)
    // Do we need to make changes?

    if (!this.oldState) {
      const ModToolbarCommand = new ModifyToolbarCommand(newState.toolbar.selectedSlot)
      this.nengiClient.addCommand(ModToolbarCommand)

    } else {
        if (this.oldState.toolbar.selectedSlot !== newState.toolbar.selectedSlot) {
          const ModToolbarCommand = new ModifyToolbarCommand(newState.toolbar.selectedSlot)
          this.nengiClient.addCommand(ModToolbarCommand)
          debugger
        }
    }
    // Trigger UIActions, then empty the actions array

    // const ModToolbarCommand = new ModifyToolbarCommand(newState.toolbar.selectedSlot)
    // this.nengiClient.addCommand(ModToolbarCommand)

    // Optimise later - you'll alwayhs need to do atleast 1 action this way
    // if (this.oldState.toolbar.selectedSlot !== newState.toolbar.selectedSlot) {
    //   const ModToolbarCommand = new ModifyToolbarCommand(newState.toolbar.selectedSlot)
    //   this.nengiClient.addCommand(ModToolbarCommand)
    //   debugger
    // }

    this.oldState = newState


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
