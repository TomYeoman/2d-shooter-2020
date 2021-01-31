import { clientFPS, phaserGameConfig } from "../../../common/config/phaserConfig";
import { installScenes, SCENE_NAME } from "../scenes";
import { MainScene } from "../scenes/main-scene";

export const newGame = () => {

    const gameConfig: Phaser.Types.Core.GameConfig = {
        ...phaserGameConfig,
        type: Phaser.AUTO,
        fps: {
            target: clientFPS,
            forceSetTimeOut: true,
        },
        parent: "game-here",
        // scene: MainScene,
    };

    // a very hackie trick to pass some custom data
    // but it work well :)
    gameConfig.callbacks = {
        preBoot: () => {
        return {  };
        }
    };

    const phaserGame = new Phaser.Game(gameConfig);

    // Add scenes to our game for later (loading, menu, main, and settings)
    installScenes(phaserGame);
    console.log("Starting game")

    return phaserGame
};

const phaserGame = newGame()

const Main = () => {
    return <div id="game-here"></div>;
};

export {phaserGame}
export default Main;
