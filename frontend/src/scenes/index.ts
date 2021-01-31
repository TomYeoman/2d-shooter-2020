import Loading from "./loading-scene";
import {MainScene} from "./main-scene";
import {LevelOne} from "./level-one";
// import GameOverScene from "./game-over-scene";

enum SCENE_NAME {
  LOADING = "LOADING",
  MAIN = "MAIN",
  LEVEL_ONE = "LEVEL_ONE",
//   GAME_OVER = "GAME_OVER"
}

/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 *
 * @param game
 */
function installScenes(game: Phaser.Game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.MAIN, MainScene, true);
  game.scene.add(SCENE_NAME.LEVEL_ONE, LevelOne, true);
//   game.scene.add(SCENE_NAME.GAME_OVER, GameOverScene);
}

export { installScenes, SCENE_NAME };
