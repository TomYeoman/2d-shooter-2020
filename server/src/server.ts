import errorHandler from "errorhandler";

require("@geckos.io/phaser-on-nodejs");
import { newGame } from "./game/main";
import nengiConfig from '../../common/config/nengiConfig'
import nengi from 'nengi'

class GameServer {
    // Server
    private nengiInstance: any

    constructor() {
      this.nengiInstance = new nengi.Instance(nengiConfig, { port: 8079 })
      newGame(this.nengiInstance);
    }
  }

new GameServer()



