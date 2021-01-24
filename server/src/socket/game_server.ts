import express from "express";
import * as http from "http";
import { newGame, PhaserGame } from "../game/game";

export class GameServer {

  // Server
  public static readonly PORT: number = 8080;
  private app: express.Application;
  private server: http.Server;
  private io: SocketIO.Server;
  private port: string | number;

  constructor(app: express.Application) {

    this.app = app;
    this.createServer();
    this.sockets();
    const game: PhaserGame = newGame(this.io);

  }

  private createServer(): void {
    this.server = require("http").Server(this.app);
    this.port = process.env.PORT || GameServer.PORT;
  }

  private sockets(): void {
    // this.io = socketIo(this.server, { origins: '*:*' });
    this.io = require("socket.io")(this.server, {
      cors: {
        origin: "*",
      }
    });

    this.server.listen(this.port, () => {
      console.log("Running server on port %s, env %s", this.port, this.app.get("env"));
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

