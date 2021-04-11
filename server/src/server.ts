import errorHandler from "errorhandler";
import app from "./app";

require("@geckos.io/phaser-on-nodejs");

import { GameServer } from "./socket/game_server";
import {test} from "../test";

// Error Handler. Provides full stack - remove for production
app.use(errorHandler());

test();
const expressApp = new GameServer(app).getApp();

export default {expressApp};


