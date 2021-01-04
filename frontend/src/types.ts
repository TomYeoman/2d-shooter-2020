export type ClientInputPacket = {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    press_time: number;
    input_sequence_number: number;
    entity_id: string;
}

export type WorldStateUpdate = {
    entity_id: string;
    positionx: number;
    positiony: number;
    last_processed_input: number;
}