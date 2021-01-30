import Phaser from "phaser";

// The following need to be defined in client / server
// - Scene
// - Parent
// - type
// _ FPS

export const serverFPS = 60
export const clientFPS = 60
export const serverBroadcastRate = 10
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


