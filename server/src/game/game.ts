import "@geckos.io/phaser-on-nodejs";
import config from "./config";

export class PhaserGame extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
      super(config);
    }
  }

export const newGame = (socketIo: SocketIO.Server) => {
    const gameConfig: any = { ...config };

    // @ts-ignore
    gameConfig.customEnvironment = true;

    // a very hackie trick to pass some custom data
    // but it work well :)
    gameConfig.callbacks = {
        preBoot: () => {
        return { socketIo: socketIo };
        }
    };

    return new PhaserGame(gameConfig);
};