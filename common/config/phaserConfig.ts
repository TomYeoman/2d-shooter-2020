import Phaser from "phaser";

// The following need to be defined in client / server
// - Scene
// - Parent
// - type
// _ FPS

export const serverFPS = 100
export const clientFPS = 100
export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
    title: "Game",
    width: 1280,
    height: 720,
    physics: {
      default: "arcade",
      arcade: {
        debug: true,
      },
    },
  };


