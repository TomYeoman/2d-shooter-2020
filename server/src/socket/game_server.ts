import express from "express";
import * as http from "http";
import { newGame } from "../game/main";
import nengi from 'nengi'
import nengiConfig from '../../../common/nengiconfig'

export class GameServer {

  // Server
  public static readonly PORT: number = 8080;
  private app: express.Application;
  private server: http.Server;
  private io: SocketIO.Server;
  private port: string | number;
  private nengiInstance: any

  constructor(app: express.Application) {

    this.app = app;
    this.createServer();
    this.sockets();
    this.nengiInstance = new nengi.Instance(nengiConfig, { port: 8079 })

    newGame(this.nengiInstance);

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

