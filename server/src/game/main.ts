import "@geckos.io/phaser-on-nodejs";
import nengi from "nengi";
import { installScenes, SCENE_NAMES } from "./index";
import config from "../config/phaser_config";
import Phaser, { Game } from "phaser";
// import {SCENE_NAMES} from "../../../common/types/types"

// export class PhaserGame extends Phaser.Game {
//     constructor(config: Phaser.Types.Core.GameConfig) {
//       super(config);
//     }
//   }

export const newGame = (nengiInstance: nengi.Instance) => {
    const gameConfig: any = { ...config };

    // @ts-ignore
    gameConfig.customEnvironment = true;

    // a very hackie trick to pass some custom data
    // but it work well :)
    gameConfig.callbacks = {
        preBoot: () => {
        return { nengiInstance };
        }
    };

    const game = new Game(gameConfig);

    // Add scenes to our game for later (loading, menu, main, and settings)
    installScenes(game);

    console.log("Starting game?");
    game.scene.start(SCENE_NAMES.MAIN);


    console.log("Starting game");

    return game;
};