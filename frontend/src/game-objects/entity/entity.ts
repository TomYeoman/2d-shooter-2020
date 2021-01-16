import { ClientInputPacket } from "../../types";

export class Entity {

  speed: number
  position_buffer: any = [];
  entity_id: string
  player: Phaser.Physics.Arcade.Sprite

  constructor(
    scene: Phaser.Scene,
    entityId: string,
    ownEntityID: string,
    map: Phaser.Tilemaps.Tilemap,
    worldLayer: Phaser.Tilemaps.StaticTilemapLayer,
    x: number,
    y: number) {
    this.speed = 5000
    this.entity_id = entityId

    this.player = scene.physics.add
      .sprite(x, y, "atlas", "misa-front")
      .setSize(30, 40)
      // .setOffset(0, 24);

    if (entityId === ownEntityID) {
      this.player.debugBodyColor = 5

      const camera = scene.cameras.main;
      camera.startFollow(this.player);
      camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      // Watch the player and worldLayer for collisions, for the duration of the scene:
      scene.physics.add.collider(this.player, worldLayer);

      var rectangle = scene.add.rectangle(x, y - 100, 148, 148, 0x6666ff);
      scene.physics.add.existing(rectangle, true);
      scene.physics.add.collider(this.player, rectangle);

    }
  }

  // Apply user's input to this entity.
  public applyInput(input: ClientInputPacket) {
    if (input.left) {
      this.player.setVelocityX(-input.press_time * this.speed);
    } else if (input.right) {
      this.player.setVelocityX(input.press_time * this.speed);
    }

    // Vertical movement
    if (input.up) {
      this.player.setVelocityY(-input.press_time * this.speed);
    } else if (input.down) {
      this.player.setVelocityY(input.press_time * this.speed);
    }

    // this.player.body.velocity.normalize().scale(this.speed);
  }

  public update() {
    this.player.setVelocity(0, 0);
  }

}
