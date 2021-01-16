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

export type WorldStateUpdate = {
    entity_id: string;
    positionx: number;
    positiony: number;
    last_processed_input: number;
}