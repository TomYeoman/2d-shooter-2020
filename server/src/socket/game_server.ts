import express from "express";
// import cors from "cors";
import * as http from "http";
// import { Message } from "./model";
import { ClientInputPacket } from "../types";
import { Entity } from "../game/entity/entity";
import { newGame, PhaserGame } from "../game/game";


// =============================================================================
//  An Entity in the world.
// =============================================================================

export class GameServer {

  // Server
  public static readonly PORT: number = 8080;
  private app: express.Application;
  private server: http.Server;
  private io: SocketIO.Server;
  private port: string | number;

  // Connected clients and their entities.
  clients: { [key: string]: Entity } = {};
  entities: { [key: string]: Entity } = {};

  // Last processed input for each client.
  last_processed_input: any = {};

  // Server timer
  updateInternal: any;

  // Queue of client inputs to process on next tick
  clientPacketsToProcess: ClientInputPacket[] = []

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

