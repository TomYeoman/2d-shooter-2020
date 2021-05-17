import nengi from "nengi";
import Phaser from "phaser";
import RequestSpawn from "../../../common/command/RequestSpawn";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { SCENE_NAMES } from "../game";
import Simulator from "../Simulator";

export class LevelOne extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
  nengiClient: ExtendedNengiTypes.Client;
  simulator: Simulator;
  last_ts: number
  levelName = "zm_castle";

  public preload() {
    console.log("Pre-load level one")

    this.load.image("player", "survivor-shotgun.png");
    this.load.image("zombie", "zombie.png");
    this.load.image("bullet", "bullet.png");

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON(this.levelName, "zm_castle.json");

  }

  create({ nengiClient }: { nengiClient: ExtendedNengiTypes.Client }) {
    //  debugger
    console.log("Create level one")
    this.nengiClient = nengiClient

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
    this.worldLayer = this.map.createStaticLayer("LevelOneWorld", tileset, 0, 0);
    // this.worldLayer.setCollisionByProperty({ collides: true });
    this.simulator = new Simulator(this.nengiClient, this, this.map);

    const RequestSpawnCommand = new RequestSpawn("")
    this.nengiClient.addCommand(RequestSpawnCommand)


  }

  public update() {
    // console.log("Running level one update")
    // console.log(this.map)
    // Compute delta time since last update.
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;

    const network = this.nengiClient.readNetwork();

    network.entities.forEach((snapshot: any) => {
      snapshot.createEntities.forEach((entity: any) => {
        // console.log(`creating new ${entity.protocol.name} entity `, entity)
        this.simulator.createEntity(entity)
      })

      snapshot.updateEntities.forEach((update: any) => {
        // console.log(`Updating entity ${update.nid}`)
        this.simulator.updateEntity(update)
      })

      snapshot.deleteEntities.forEach((id: number) => {
        // console.log(`Deleting entity `, id)
        this.simulator.deleteEntity(id)
      })
    })

    network.messages.forEach((message: any) => {
      // console.log(`Recieved ${message.protocol.name} message:`, message);
      this.simulator.processMessage(message)
    });

    // console.log(dt_sec)
    this.simulator.update(dt_sec);
    this.nengiClient.update();
  }
}
