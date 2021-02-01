import Phaser from "phaser";
import { SCENE_NAMES } from "../game";

export class LevelZero extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  worldLayer: Phaser.Tilemaps.StaticTilemapLayer;

  public preload() {
    console.log("Pre-load level one")

    this.load.image("tiles", "tuxmon-sample-32px-extruded.png");
    this.load.tilemapTiledJSON("map2", "minigame_1.json");

  }

    public create(data:any) {
    //  debugger
      console.log("Create level one")

      this.map = this.make.tilemap({ key: "map2" });

      const tileset = this.map.addTilesetImage(
        "tuxmon-sample-32px-extruded",
        "tiles"
      );

      this.map.createStaticLayer(
        "Below Player",
        tileset,
        0,
        0
      );

      this.worldLayer = this.map.createStaticLayer("World", tileset, 0, 0);
      this.worldLayer.setCollisionByProperty({ collides: true });

      console.log("Restarting MAIN in 3 seconds")
      setTimeout(() => {
        this.scene.sleep(SCENE_NAMES.LEVEL_ZERO)
        this.scene.wake(SCENE_NAMES.LEVEL_ONE, {data: true})
      }, 3000)

  }

  public update() {
    console.log("Running level one update")
  }
}
