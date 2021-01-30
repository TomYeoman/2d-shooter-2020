import { Player } from "../entities/player"
import { Wall } from "../entities/wall"
import Phaser from "phaser";

export type ClientInputPacket = {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    press_time: number;
    input_sequence_number: number;
    entity_id: string;
}

export type ClientInput = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    rotation: number;
    mouseDown: false;
}

// World State

export type EntityPlayer = {
    type: EntityEnum.PLAYER,
    entity_id: string,
    x: number,
    y: number,
    last_processed_input: number,
}

export type EntityWall = {
    entity_id: string,
    type: EntityEnum.WALL,
    x: number,
    y: number,
    last_processed_input: number
}

export type WorldStateUpdate = (EntityPlayer | EntityWall)[]

export type PositionBuffer = [
    number, number, number
]

export enum EntityEnum {
    WALL = "wall",
    PLAYER = "player",
}

export type Entities = { [key: string]: Player | Wall }
