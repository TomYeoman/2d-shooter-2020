import { ArrowKeys, WASDKeys } from "./constants/keybinds";
import { ClientInput } from "../../common/types/types";

export class InputSystem {

    frameInputState: ClientInput
    keyboard: any
    isMoving: false

    constructor(scene: Phaser.Scene) {

        this.keyboard = scene.input.keyboard.addKeys(WASDKeys);

        this.frameInputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            rotation: 0,
            mouseDown: false
        }
    }

    updateInputState() {
        const left = this.keyboard.left.isDown;
        const right = this.keyboard.right.isDown;
        const up = this.keyboard.up.isDown;
        const down = this.keyboard.down.isDown;

        this.isMoving = left || right  || up || down
        this.frameInputState = {
            up: up,
            down: down,
            left: left,
            right: right,
            rotation: 0,
            mouseDown: false
        }
    }
}

