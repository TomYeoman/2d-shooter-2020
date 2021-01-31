import { clientFPS, phaserGameConfig } from "../../../common/config/phaserConfig";
import { installScenes, SCENE_NAME } from "../scenes";
import { MainScene } from "../scenes/main-scene";

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

const phaserGame = new Phaser.Game(gameConfig);
installScenes(phaserGame);
// phaserGame.scene.start(SCENE_NAME.MAIN);

const Main = () => {
    return <div id="game-here"></div>;
};

export {phaserGame}
export default Main;
