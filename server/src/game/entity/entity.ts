import logger from "../../util/logger";
import { ClientInputPacket } from "../../types";

export class Entity {

  speed: number
  position_buffer: any = [];
  entity_id: string
  player: Phaser.Physics.Arcade.Sprite
  frameVelocityX = 0
  frameVelocityY= 0
  scaler = 0

  constructor(scene: Phaser.Scene, entityId: string, map: Phaser.Tilemaps.Tilemap, worldLayer: Phaser.Tilemaps.StaticTilemapLayer) {

    this.speed = 5000;

    const clientFrameRate = 60;
    const serverFrameRate = 5;
    this.scaler = clientFrameRate / serverFrameRate;

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint: any = map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");
    this.player = scene.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
      .setSize(30, 40)
      .setOffset(0, 24);

    this.speed = 5000;
    this.entity_id = entityId;

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    scene.physics.add.collider(this.player, worldLayer);
  }

  // Apply the total of all inputs from client, for this server frame
  // I.E client @ 60FPS, Server is 10FPS. We process all 10 inputs
  // at once every server tick, creating a "total" velocity, and then
  // adjust it depending on the server tick rate.
  public applyInput(input: ClientInputPacket) {
    if (input.left) {
      this.frameVelocityX += (-input.press_time * this.speed);
    } else if (input.right) {
      this.frameVelocityX += (input.press_time * this.speed);
    }
    if (input.up) {
      this.frameVelocityY += (-input.press_time * this.speed);
    } else if (input.down) {
      this.frameVelocityY += (input.press_time * this.speed);
    }

    this.player.setVelocityX(this.frameVelocityX / this.scaler);
    this.player.setVelocityY(this.frameVelocityY / this.scaler);

  }

  public update() {
     this.frameVelocityX = 0;
     this.frameVelocityY = 0;
      this.player.setVelocity(0, 0);
     logger.info("Resetting velocity");
  }
}
