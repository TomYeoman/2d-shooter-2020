require("@geckos.io/phaser-on-nodejs");
import Phaser from "phaser";
import MainScene from "./scene";

// set the fps you need
const FPS = 5;
// @ts-ignore
global.phaserOnNodeFPS = FPS; // default is 60

// prepare the config for Phaser
const config = {
  type: Phaser.HEADLESS,
  width: 1280,
  height: 720,
  banner: false,
  audio: false,
  scene: [MainScene],
  fps: {
    target: FPS
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  }
};

export default config;