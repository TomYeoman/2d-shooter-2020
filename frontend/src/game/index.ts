// import Loading from "./loading-scene";
import {MainScene} from "../scenes/main-scene";
import {LevelOne} from "../scenes/level-one";
// import { LevelZero } from "./level-zero";
// import GameOverScene from "./game-over-scene";
import {SCENE_NAMES} from "../../../common/types/types"
/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 *
 * @param game
 */
function installScenes(game: Phaser.Game) {
  // game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAMES.MAIN, MainScene);
  game.scene.add(SCENE_NAMES.LEVEL_ONE, LevelOne);
  // game.scene.add(SCENE_NAME.LEVEL_ZERO, LevelZero, true);

}

export { installScenes, SCENE_NAMES };
