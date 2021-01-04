import errorHandler from "errorhandler";
import app from "./app";
import config from "./game/config";

require('@geckos.io/phaser-on-nodejs')
const Phaser = require('phaser')

import { GameServer } from "./socket/game_server";

// Error Handler. Provides full stack - remove for production
app.use(errorHandler());


let expressApp = new GameServer(app).getApp();

// start the game
// new Phaser.Game(config)

export default {expressApp};


