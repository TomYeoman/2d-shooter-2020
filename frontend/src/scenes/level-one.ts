import nengi from "nengi";
import Phaser from "phaser";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";
import { SCENE_NAMES } from "../game";

export class LevelOne extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;
  last_ts: number
  nengiClient: ExtendedNengiTypes.Client

  public preload() {
    console.log("Pre-load level one")

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON("map2", "minigame_1.json");

  }

  create({ nengiClient }: { nengiClient: ExtendedNengiTypes.Client }) {
    //  debugger
    console.log("Create level one")
    this.nengiClient = nengiClient

    this.map = this.make.tilemap({ key: "map2" });

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
    this.worldLayer.setCollisionByProperty({ collides: true });

    // console.log("Restarting MAIN in 3 seconds")
    // setTimeout(() => {
    //   this.scene.stop(SCENE_NAMES.LEVEL_ONE)
    //   this.scene.run(SCENE_NAMES.MAIN)
    // }, 3000)

    // this.events.on(Phaser.Scenes.Events.WAKE, () => {
    //   // debugger
    //   setTimeout(() => {
    //     console.log("Back to level 1 in 3 seconds")
    //     this.scene.sleep(SCENE_NAMES.LEVEL_ONE)
    //     this.scene.run(SCENE_NAMES.MAIN, {data: true})
    //   }, 3000)
    // });

  }

  public update() {
    console.log("Running level one update")

    //   const now_ts = +new Date();
    //   const last_ts = this.last_ts || now_ts;
    //   const dt_sec = (now_ts - last_ts) / 1000.0;
    //   this.last_ts = now_ts;

    //   const network = this.nengiClient.readNetwork();

    //   network.entities.forEach((snapshot:any) => {
    //     snapshot.createEntities.forEach((entity:any) => {
    //         this.simulator.createEntity(entity)
    //     })

    //     snapshot.updateEntities.forEach((update:any) => {
    //         this.simulator.updateEntity(update)
    //     })

    //     snapshot.deleteEntities.forEach((id: string) => {
    //         this.simulator.deleteEntity(id)
    //     })
    // })

    //   network.messages.forEach((message: any) => {
    //     this.simulator.processMessage(message)
    //     console.log("Recieved message:", message);
    //   });

    //   this.simulator.update(dt_sec);
    // this.nengiClient.update();

  }
}
