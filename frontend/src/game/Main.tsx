import nengi from "nengi";
import { clientFPS, phaserGameConfig } from "../../../common/config/phaserConfig";
import { installScenes } from ".";
import {SCENE_NAMES} from "../../../common/types/types"

export const newGame = () => {

    const gameConfig: Phaser.Types.Core.GameConfig = {
        ...phaserGameConfig,
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        fps: {
            target: clientFPS,
            forceSetTimeOut: true,
        },
        parent: "game-here",
        // scene: MainScene,
    };

    const phaserGame = new Phaser.Game(gameConfig);

    // Add scenes to our game for later (loading, menu, main, and settings)
    installScenes(phaserGame);

    phaserGame.scene.start(SCENE_NAMES.MAIN)
    return phaserGame
};

const phaserGame = newGame()

const Main = () => {
    return <div id="game-here"></div>;
};

export {phaserGame}
export default Main;
